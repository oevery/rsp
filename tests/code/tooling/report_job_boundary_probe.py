"""Observe job result read boundaries on copies; no execution or regrading."""
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


def render(job, mode):
    evaluate = load_evaluate()
    target = job / "result.json"
    read_text = Path.read_text
    hits = []
    observation = {"reportCompleted": False, "counts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if mode == "read-denied" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected job result read refusal")
        return read_text(path, *args, **kwargs)

    sys.argv = ["evaluate.py", "report", str(job)]
    try:
        with ExitStack() as stack:
            guards(stack, evaluate, target, False, [])
            stack.enter_context(patch.object(Path, "read_text", read))
            code = evaluate.main()
            observation["reportCompleted"] = True
            summary = (job / "summary.md").read_text()
            lines = [line for line in summary.splitlines()
                     if re.fullmatch(r"[a-z-]+: \d+(?:, [a-z-]+: \d+)*", line)]
            assert len(lines) == 1
            counts = {key: int(value) for key, value in
                      (item.split(": ") for item in lines[0].split(", "))}
            observation["counts"] = counts
            observation["classificationExit"] = evaluate.exit_status(job, counts)
            observation["incompleteCount"] = counts.get("incomplete", 0)
            return code
    except Exception as error:
        observation["exception"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        observation["injectedReads"] = hits
        save(job.parent / "render-observation.json", observation)


def run(source, output):
    source, output = source.resolve(), output.resolve()
    inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and inputs.is_dir()
    assert output != source and source not in output.parents and inputs not in output.parents
    output.mkdir(parents=True, exist_ok=False)
    evaluate = load_evaluate()
    original, original_inputs = hashes(source), hashes(inputs)
    rows = list(evaluate.native_results(source))
    assert len(rows) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in rows)
    assert json.loads((source / "result.json").read_text())["n_total_trials"] == 2
    save(output / "source-before.json", {"source": str(source), "inputs": str(inputs),
         "jobHashes": original, "inputHashes": original_inputs})
    observations, summaries = [], {}
    for mode in ("normal", "missing", "invalid-json", "read-denied"):
        case = output / mode
        case.mkdir()
        job, saved_inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(inputs, saved_inputs)
        target = job / "result.json"
        shutil.copy2(target, case / "original-job-result.json")
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        if mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"n_total_trials":')
        before = hashes(job)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in before.items() if k != "summary.md"} == {
            k: v for k, v in after.items() if k != "summary.md"}
        assert all(after.get(k) == h for k, h in original.items() if k not in ("result.json", "summary.md"))
        assert hashes(saved_inputs) == original_inputs
        retained = list(evaluate.native_results(job))
        assert len(retained) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in retained)
        completed = observed["reportCompleted"]
        included = None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            summaries[mode] = summary
            included = all(f"| {r['task_name']} | passed |" in summary for _, r in retained)
            assert included
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert before["summary.md"] == after["summary.md"]
        assert completed and observed["counts"] == {"passed": 2}
        assert observed["classificationExit"] == 0
        if mode == "normal":
            assert "Planned trials: 2 (from job result.json)." in summary
            assert "Run completeness: unknown" not in summary
        else:
            assert "Planned trials: unknown. Run completeness: unknown." in summary
            assert "classification exit 0 does not confirm run completeness" in summary
            assert "report command exit 0 only confirms report generation" in summary
            error_type = {"missing": "FileNotFoundError", "invalid-json": "JSONDecodeError",
                          "read-denied": "PermissionError"}[mode]
            assert "result.json: " + error_type in summary
            assert "Planned trials: 2" not in summary
        if mode == "read-denied":
            assert set(observed["injectedReads"]) == {str(target)}
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "jobResultPlanAvailable": mode == "normal",
            "plannedTotalFromJobResult": 2 if mode == "normal" else None,
            "completenessFromJobResult": "2 returned of 2 planned" if mode == "normal" else "unknown",
            "validTrialResultsPreserved": True, "validTrialsIncludedInCurrentReport": included,
            "frozenInputsPreserved": True, "otherJobEvidencePreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report",
            "changedByReport": [k for k in sorted(before.keys() | after.keys()) if before.get(k) != after.get(k)]}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, flush=True)
    assert hashes(source) == original and hashes(inputs) == original_inputs
    save(output / "observations.json", observations)
    unavailable = [r["case"] for r in observations if not r["reportCompleted"]]
    assert summaries["missing"] != summaries["normal"]
    save(output / "summary.json", {"cases": 4, "unavailableReports": unavailable,
         "missingPlanReportIdenticalToNormal": summaries["missing"] == summaries["normal"],
         "interpretation": "Returned successes and exit 0 do not prove planned completeness when job result is unavailable.",
         "originalsPreserved": True, "scope": "Job result read boundary only; no execution or regrade"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), sys.argv[3]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
