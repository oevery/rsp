"""Observe baseline result reads with identical preserved current-job inputs."""
import argparse
from collections import Counter
from contextlib import ExitStack
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from unittest.mock import patch

from report_details_boundary_probe import ROOT, guards, hashes, load_evaluate, save


def render(job, baseline, target, mode):
    evaluate = load_evaluate()
    read_text = Path.read_text
    hits = []
    observed = {"reportCompleted": False, "currentCounts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if mode == "read-denied" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected baseline trial result read refusal")
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
        observed["injectedReads"] = hits
        save(job.parent / "render-observation.json", observed)


def run(source, output):
    source, output = source.resolve(), output.resolve()
    source_inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and source_inputs.is_dir()
    assert output not in (source, source_inputs) and source not in output.parents and source_inputs not in output.parents
    evaluate = load_evaluate()
    rows = list(evaluate.native_results(source))
    assert len(rows) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in rows)
    assert json.loads((source / "result.json").read_text())["n_total_trials"] == 2
    original, original_inputs = hashes(source), hashes(source_inputs)
    target_relative = rows[0][0].relative_to(source) / "result.json"
    peer_relative = rows[1][0].relative_to(source) / "result.json"
    target_name, peer_name = rows[0][1]["task_name"], rows[1][1]["task_name"]
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(source_inputs),
         "jobHashes": original, "inputHashes": original_inputs,
         "design": "Current and baseline are separate copies of the same job; isolate read faults, not performance."})
    observations = []
    for mode in ("normal", "missing", "invalid-json", "read-denied"):
        case = output / mode
        case.mkdir()
        current, baseline = case / "current", case / "baseline"
        for job in (current, baseline):
            shutil.copytree(source, job)
            shutil.copytree(source_inputs, job.with_name(job.name + ".inputs"))
        shutil.copy2(current / "summary.md", case / "original-current-summary.md")
        shutil.copy2(baseline / target_relative, case / "original-baseline-result.json")
        target = baseline / target_relative
        if mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"task_name":')
        baseline_before = hashes(baseline)
        command = [sys.executable, str(Path(__file__).resolve()), "--render",
                   str(current), str(baseline), str(target), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(current)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in original.items() if k != "summary.md"}
        assert hashes(baseline) == baseline_before
        assert all(baseline_before.get(k) == h for k, h in original.items() if k != str(target_relative))
        for job in (current, baseline):
            assert hashes(job.with_name(job.name + ".inputs")) == original_inputs
        current_counts = Counter(evaluate.verdict(d, r) for d, r in evaluate.native_results(current))
        assert current_counts == {"passed": 2}
        current_exit = evaluate.exit_status(current, current_counts)
        assert current_exit == 0
        peer = json.loads((baseline / peer_relative).read_text())
        peer_verdict = evaluate.verdict((baseline / peer_relative).parent, peer)
        assert peer_verdict == "passed"
        completed = observed["reportCompleted"]
        comparison, current_visible, peer_visible = None, None, None
        if completed:
            assert result.returncode == 0
            summary = (current / "summary.md").read_text()
            current_visible = all(f"| {r['task_name']} | passed |" in summary for _, r in rows)
            peer_line = f"- {peer_name}: {{'passed': 1}} → {{'passed': 1}}"
            peer_visible = peer_line in summary
            assert current_visible and peer_visible
            lines = summary.splitlines()
            index = next(i for i, line in enumerate(lines) if line.startswith(f"- {target_name}:"))
            comparison = lines[index:index + 2]
        else:
            assert result.returncode != 0
            assert observed["currentCounts"] is None and observed["classificationExit"] is None
            assert after["summary.md"] == original["summary.md"]
        assert completed and observed["currentCounts"] == {"passed": 2} and observed["classificationExit"] == 0
        if mode in ("normal", "missing"):
            assert "Unreadable baseline trial results" not in summary
            if mode == "missing":
                assert comparison[0] == f"- {target_name}: missing → {{'passed': 1}}"
                assert "task_checksum unavailable" in comparison[1] and "agent model/settings unavailable" in comparison[1]
                assert "must not be attributed to candidate improvement" in comparison[1]
            else:
                assert comparison[0] == f"- {target_name}: {{'passed': 1}} → {{'passed': 1}}"
                assert "Recorded task checksum and agent model/settings match" in comparison[1]
        else:
            assert "Unreadable baseline trial results" in summary
            assert evaluate.diagnostic_text(target_relative) in summary
            assert ("JSONDecodeError" if mode == "invalid-json" else "PermissionError") in summary
            assert comparison[0] == f"- {target_name}: unavailable → {{'passed': 1}}"
            assert "per-task coverage unavailable" in comparison[1]
            assert "must not be interpreted as improvement" in summary
            assert "classification exit status do not establish baseline completeness" in summary
            assert "Recorded task checksum and agent model/settings match" not in summary
        if mode == "read-denied":
            assert observed["injectedReads"] == [str(target)]
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "currentNativeCountsIndependentlyObserved": dict(current_counts), "currentNativeClassificationExit": current_exit,
            "currentResultsPreserved": True, "baselinePeerVerdict": peer_verdict,
            "baselineEvidenceUnchangedByReport": True, "frozenInputsPreserved": True,
            "currentResultsIncludedInNewReport": current_visible, "baselinePeerIncludedInComparison": peer_visible,
            "affectedComparison": comparison,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, flush=True)
    assert hashes(source) == original and hashes(source_inputs) == original_inputs
    save(output / "observations.json", observations)
    unavailable = [r["case"] for r in observations if not r["reportCompleted"]]
    save(output / "summary.json", {"cases": 4, "unavailableReports": unavailable,
         "originalJobAndFrozenInputsPreserved": True, "scope": "Baseline trial read boundary only; no execution or regrade"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 6 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]), sys.argv[5]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
