"""Observe baseline job plans independently of retained trial outcomes."""
import argparse
from contextlib import ExitStack
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from unittest.mock import patch

from report_details_boundary_probe import ROOT, guards, hashes, load_evaluate, save


def render(job, baseline, mode):
    evaluate = load_evaluate()
    target = baseline / "result.json"
    read_text = Path.read_text
    reads, refusals = [], []
    observed = {"reportCompleted": False, "currentCounts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if path == target:
            reads.append(str(path))
            if mode == "read-denied":
                refusals.append(str(path))
                raise PermissionError("Injected baseline job result read refusal")
        return read_text(path, *args, **kwargs)

    sys.argv = ["evaluate.py", "report", str(job), "--baseline", str(baseline)]
    try:
        with ExitStack() as stack:
            guards(stack, evaluate, target, False, [])
            stack.enter_context(patch.object(Path, "read_text", read))
            code = evaluate.main()
            observed["reportCompleted"] = True
            summary = (job / "summary.md").read_text()
            lines = [line for line in summary.splitlines()
                     if re.fullmatch(r"[a-z-]+: \d+(?:, [a-z-]+: \d+)*", line)]
            assert len(lines) == 1
            counts = {key: int(value) for key, value in
                      (item.split(": ") for item in lines[0].split(", "))}
            observed["currentCounts"] = counts
            observed["classificationExit"] = evaluate.exit_status(job, counts)
            return code
    except Exception as error:
        observed["exception"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        observed["baselineJobReadAttempts"] = reads
        observed["injectedReadRefusals"] = refusals
        save(job.parent / "render-observation.json", observed)


def run(source, output):
    source, output = source.resolve(), output.resolve()
    source_inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and source_inputs.is_dir()
    assert output not in (source, source_inputs) and source not in output.parents and source_inputs not in output.parents
    evaluate = load_evaluate()
    rows = list(evaluate.native_results(source))
    assert len(rows) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in rows)
    native_job = json.loads((source / "result.json").read_text())
    assert native_job["n_total_trials"] == 2
    original, original_inputs = hashes(source), hashes(source_inputs)
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(source_inputs),
         "jobHashes": original, "inputHashes": original_inputs,
         "design": "Separate same-source current/baseline copies isolate plan visibility, not performance."})
    observations, normal_summary = [], None
    for mode in ("normal", "planned-more", "missing", "invalid-json", "read-denied"):
        case = output / mode
        case.mkdir()
        current, baseline = case / "current", case / "baseline"
        for job in (current, baseline):
            shutil.copytree(source, job)
            shutil.copytree(source_inputs, job.with_name(job.name + ".inputs"))
        shutil.copy2(current / "summary.md", case / "original-current-summary.md")
        target = baseline / "result.json"
        shutil.copy2(target, case / "original-baseline-job-result.json")
        if mode == "planned-more":
            target.write_text(json.dumps({**native_job, "n_total_trials": 3}, indent=2) + "\n")
        elif mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"n_total_trials":')
        baseline_before = hashes(baseline)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(current), str(baseline), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(current)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in original.items() if k != "summary.md"}
        assert hashes(baseline) == baseline_before
        assert all(baseline_before.get(k) == h for k, h in original.items() if k != "result.json")
        for job in (current, baseline):
            assert hashes(job.with_name(job.name + ".inputs")) == original_inputs
            retained = list(evaluate.native_results(job))
            assert len(retained) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in retained)
        completed = observed["reportCompleted"]
        same, comparisons, limits = None, None, None
        if completed:
            assert result.returncode == 0 and observed["currentCounts"] == {"passed": 2}
            assert observed["classificationExit"] == 0
            summary = (current / "summary.md").read_text()
            for _, value in rows:
                assert f"| {value['task_name']} | passed |" in summary
                assert f"- {value['task_name']}: {{'passed': 1}} → {{'passed': 1}}" in summary
            # Normalize only the explicit baseline locator, not diagnostic or
            # comparison content, so omitted plan distinctions stay observable.
            normalized = summary.replace(f"Baseline: {baseline}", "Baseline: <case baseline>", 1)
            with (case / "normalized-report.md").open("x") as stream:
                stream.write(normalized)
            if mode == "normal":
                normal_summary = normalized
            same = normalized == normal_summary
            comparisons = [line for line in summary.splitlines() if line.startswith("- ") and " → " in line]
            limits = [line.strip() for line in summary.splitlines() if line.strip().startswith("Comparison limited:")]
        else:
            assert result.returncode != 0
            assert observed["currentCounts"] is None and observed["classificationExit"] is None
            assert after["summary.md"] == original["summary.md"]
        if mode == "normal":
            assert completed
        accessible_plan = 2 if mode == "normal" else 3 if mode == "planned-more" else None
        state = "complete" if mode == "normal" else "incomplete" if mode == "planned-more" else "unknown"
        assert completed and set(observed["baselineJobReadAttempts"]) == {str(target)}
        assert set(observed["injectedReadRefusals"]) == ({str(target)} if mode == "read-denied" else set())
        plan_line = f"Baseline planned trials: {accessible_plan if accessible_plan is not None else 'unknown'}."
        returned_line = "Baseline returned trials (readable records): 2."
        state_line = f"Baseline completeness: {state} (record counts only)."
        assert all(line in summary for line in (plan_line, returned_line, state_line))
        assert "Current-job classification exit 0 does not confirm baseline completeness" in summary
        if mode != "normal":
            assert not same and any(f"baseline completeness {state}" in line for line in limits)
        if accessible_plan is None:
            error_type = {"missing": "FileNotFoundError", "invalid-json": "JSONDecodeError", "read-denied": "PermissionError"}[mode]
            assert "Baseline plan unavailable:" in summary and error_type in summary
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "reportedPlanLines": [plan_line, returned_line, state_line],
            "fixtureAccessiblePlannedTrials": accessible_plan, "independentlyObservedReturnedTrials": 2,
            "fixturePlanState": "complete" if mode == "normal" else "incomplete" if mode == "planned-more" else "unknown",
            "sameReportAsNormalAfterLocatorNormalization": same,
            "planConditionNotDistinguished": mode != "normal" and same is True,
            "comparisonOutcomeLines": comparisons, "comparisonLimitationLines": limits,
            "currentAndBaselineTrialScoresPreserved": True, "baselineEvidenceUnchangedByReport": True,
            "frozenInputsPreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, "baseline reads", len(observed["baselineJobReadAttempts"]), flush=True)
    assert hashes(source) == original and hashes(source_inputs) == original_inputs
    save(output / "observations.json", observations)
    unavailable = [o["case"] for o in observations if not o["reportCompleted"]]
    indistinguishable = [o["case"] for o in observations if o["planConditionNotDistinguished"]]
    save(output / "summary.json", {"cases": 5, "unavailableReports": unavailable,
         "planConditionsNotDistinguished": indistinguishable, "originalJobAndFrozenInputsPreserved": True,
         "scope": "Baseline job plan visibility only; no execution or regrade"})
    return 1 if unavailable or indistinguishable else 0


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
