"""Observe one unreadable trial result without executing or regrading tasks."""
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


def render(job, target, mode):
    evaluate = load_evaluate()
    read_text = Path.read_text
    hits = []
    observation = {"reportCompleted": False, "counts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if mode == "read-denied" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected trial result read refusal")
        return read_text(path, *args, **kwargs)

    sys.argv = ["evaluate.py", "report", str(job)]
    try:
        with ExitStack() as stack:
            guards(stack, evaluate, target, False, [])
            stack.enter_context(patch.object(Path, "read_text", read))
            code = evaluate.main()
            observation["reportCompleted"] = True
            # Consume the public aggregate line actually emitted by the CLI,
            # rather than reconstructing counts from the expected outcome.
            summary = (job / "summary.md").read_text()
            lines = [line for line in summary.splitlines()
                     if re.fullmatch(r"[a-z-]+: \d+(?:, [a-z-]+: \d+)*", line)]
            assert len(lines) == 1
            counts = {key: int(value) for key, value in (item.split(": ") for item in lines[0].split(", "))}
            observation["counts"] = counts
            observation["classificationExit"] = evaluate.exit_status(job, counts)
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
    assert len(rows) == 2, "Select a two-trial job so one unaffected peer remains"
    assert all(evaluate.verdict(d, r) == "passed" for d, r in rows)
    assert json.loads((source / "result.json").read_text())["n_total_trials"] == 2
    target_relative = rows[0][0].relative_to(source) / "result.json"
    peer_relative = rows[1][0].relative_to(source) / "result.json"
    save(output / "source-before.json", {"source": str(source), "inputs": str(inputs),
         "jobHashes": original, "inputHashes": original_inputs,
         "target": str(target_relative), "peer": str(peer_relative)})
    observations = []
    for mode in ("normal", "missing", "invalid-json", "read-denied"):
        case = output / mode
        case.mkdir()
        job, saved_inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(inputs, saved_inputs)
        target, peer = job / target_relative, job / peer_relative
        shutil.copy2(target, case / "original-trial-result.json")
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        if mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"task_name":')
        before = hashes(job)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), str(target), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in before.items() if k != "summary.md"} == {
            k: v for k, v in after.items() if k != "summary.md"}
        assert all(after.get(k) == h for k, h in original.items()
                   if k not in (str(target_relative), "summary.md"))
        assert hashes(saved_inputs) == original_inputs
        assert peer.read_bytes() == (source / peer_relative).read_bytes()
        peer_result = json.loads(peer.read_text())
        peer_verdict = evaluate.verdict(peer.parent, peer_result)
        assert peer_verdict == "passed"
        completed = observed["reportCompleted"]
        if mode in ("normal", "missing", "invalid-json", "read-denied"):
            assert completed and result.returncode == 0
            expected = {"passed": 2} if mode == "normal" else {"passed": 1, "incomplete": 1}
            assert observed["counts"] == expected
            assert observed["classificationExit"] == (0 if mode == "normal" else 1)
        if mode == "read-denied":
            assert observed["injectedReads"] == [str(target)]
        peer_in_report = None
        if completed:
            summary = (job / "summary.md").read_text()
            peer_in_report = f"| {peer_result['task_name']} | passed |" in summary
            assert peer_in_report
            target_name = rows[0][1]["task_name"]
            if mode != "normal":
                assert f"| {target_name} |" not in summary
                assert f"- {target_name} (" not in summary
            if mode in ("invalid-json", "read-denied"):
                assert "## Unreadable trial results" in summary
                assert evaluate.diagnostic_text(target_relative) in summary
                error_type = "JSONDecodeError" if mode == "invalid-json" else "PermissionError"
                assert error_type in summary
                assert "task identities and scores are unavailable" in summary
            else:
                assert "## Unreadable trial results" not in summary
        else:
            assert result.returncode != 0
            assert before["summary.md"] == after["summary.md"]
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "peerResultPreserved": True, "peerVerdictIndependentlyObserved": peer_verdict,
            "peerIncludedInCurrentReport": peer_in_report,
            "jobResultAndOtherEvidencePreserved": True, "frozenInputsPreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report",
            "changedByReport": [k for k in sorted(before.keys() | after.keys()) if before.get(k) != after.get(k)]}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, flush=True)
    assert hashes(source) == original and hashes(inputs) == original_inputs
    save(output / "observations.json", observations)
    failed = [r["case"] for r in observations if not r["reportCompleted"]]
    save(output / "summary.json", {"cases": 4, "unavailableReports": failed,
         "originalsPreserved": True, "scope": "Trial result boundary only; no execution or regrade"})
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
