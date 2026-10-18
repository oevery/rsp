"""Observe retained usage read failures on new job copies without execution."""
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


def render(job, target, mode):
    evaluate = load_evaluate()
    read_text = Path.read_text
    hits = []
    observed = {"reportCompleted": False, "reportCounts": None, "reportClassificationExit": None}

    def read(path, *args, **kwargs):
        if mode != "normal" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected usage evidence read refusal")
        return read_text(path, *args, **kwargs)

    sys.argv = ["evaluate.py", "report", str(job)]
    try:
        with ExitStack() as stack:
            guards(stack, evaluate, target, False, [])
            stack.enter_context(patch.object(Path, "read_text", read))
            # Observe classification separately even if report rendering fails.
            rows = list(evaluate.native_results(job))
            counts = Counter(evaluate.verdict(d, r) for d, r in rows)
            observed["independentNativeCounts"] = dict(counts)
            observed["independentClassificationExit"] = evaluate.exit_status(job, counts)
            observed["nativeRewards"] = {d.name: r.get("verifier_result") for d, r in rows}
            code = evaluate.main()
            observed["reportCompleted"] = True
            summary = (job / "summary.md").read_text()
            lines = [line for line in summary.splitlines()
                     if re.fullmatch(r"[a-z-]+: \d+(?:, [a-z-]+: \d+)*", line)]
            assert len(lines) == 1
            counts = {key: int(value) for key, value in
                      (item.split(": ") for item in lines[0].split(", "))}
            observed["reportCounts"] = counts
            observed["reportClassificationExit"] = evaluate.exit_status(job, counts)
            return code
    except Exception as error:
        observed["exception"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        observed["injectedReads"] = hits
        save(job.parent / "render-observation.json", observed)


def run(source, output):
    source, output = source.resolve(), output.resolve()
    inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and inputs.is_dir()
    assert output not in (source, inputs) and source not in output.parents and inputs not in output.parents
    evaluate = load_evaluate()
    rows = list(evaluate.native_results(source))
    assert len(rows) == 2 and all(evaluate.verdict(d, r) == "passed" for d, r in rows)
    assert json.loads((source / "result.json").read_text())["n_total_trials"] == 2
    target_trial, peer = rows[0][0], rows[1][0]
    usage = {d.name: evaluate.session_usage(d / "agent") for d, _ in rows}
    assert all(u["status"] == "complete" for u in usage.values())
    root_usage = usage[target_trial.name]
    root_session = next(Path(s["path"]) for s in root_usage["sessions"] if s["id"] == root_usage["root"])
    stream = target_trial / "agent/codex.txt"
    assert stream.is_file() and root_session.is_file()
    original, original_inputs = hashes(source), hashes(inputs)
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(inputs),
         "jobHashes": original, "inputHashes": original_inputs, "usageBeforeInjection": usage})
    observations = []
    for mode, selected in (("normal", stream), ("main-log-read-denied", stream), ("session-read-denied", root_session)):
        case = output / mode
        case.mkdir()
        job = case / "job"
        shutil.copytree(source, job)
        shutil.copytree(inputs, case / "job.inputs")
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        target = job / selected.relative_to(source)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), str(target), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in original.items() if k != "summary.md"}
        assert hashes(case / "job.inputs") == original_inputs
        assert observed["independentNativeCounts"] == {"passed": 2}
        assert observed["independentClassificationExit"] == 0
        assert observed["nativeRewards"] == {d.name: r.get("verifier_result") for d, r in rows}
        assert set(observed["injectedReads"]) == (set() if mode == "normal" else {str(target)})
        completed = observed["reportCompleted"]
        table_rows, target_unknown, peer_visible, peer_usage_preserved = {}, None, None, None
        if completed:
            assert result.returncode == 0 and observed["reportCounts"] == {"passed": 2}
            assert observed["reportClassificationExit"] == 0
            summary = (job / "summary.md").read_text()
            for directory, native in rows:
                matches = [line for line in summary.splitlines() if line.startswith(f"| {native['task_name']} |")]
                assert len(matches) == 1
                fields = [item.strip() for item in matches[0].split("|")[1:-1]]
                assert fields[1] == "passed"
                table_rows[directory.name] = fields
            target_unknown = table_rows[target_trial.name][2:5] == ["unknown"] * 3
            peer_visible = peer.name in table_rows
            total = usage[peer.name]["total"]
            peer_usage_preserved = table_rows[peer.name][2:5] == [str(total[k]) for k in ("input_tokens", "cached_input_tokens", "output_tokens")]
            assert peer_visible and peer_usage_preserved
            if mode == "normal":
                total = usage[target_trial.name]["total"]
                assert table_rows[target_trial.name][2:5] == [str(total[k]) for k in ("input_tokens", "cached_input_tokens", "output_tokens")]
                assert "Executor usage unavailable" not in summary
            else:
                assert "Executor usage unavailable: PermissionError: Injected usage evidence read refusal" in summary
                assert "native verdict and scores retained" in summary
        else:
            assert result.returncode != 0
            assert observed["reportCounts"] is None and observed["reportClassificationExit"] is None
            assert after["summary.md"] == original["summary.md"]
            assert observed["exception"]["type"] == "PermissionError"
        if mode == "normal":
            assert completed
        unmet = []
        if not completed:
            unmet.append("report unavailable; usage-unknown and peer display cannot be assessed")
        elif mode != "normal" and not target_unknown:
            unmet.append("affected usage is not displayed as unknown")
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "target": str(selected.relative_to(source)), "peer": peer.name,
            "reportedRows": table_rows, "affectedUsageDisplayedUnknown": target_unknown,
            "peerIncludedInNewReport": peer_visible, "peerUsagePreservedInNewReport": peer_usage_preserved,
            "unmetExpectations": unmet, "nativeRecordsAndUsageFilesPreserved": True, "frozenInputsPreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, "classification independently observed", observed["independentClassificationExit"], flush=True)
    assert hashes(source) == original and hashes(inputs) == original_inputs
    save(output / "observations.json", observations)
    failures = [o["case"] for o in observations if o["unmetExpectations"]]
    save(output / "summary.json", {"cases": 3, "unmetCases": failures,
         "originalJobAndFrozenInputsPreserved": True,
         "scope": "Report usage read boundary only; no executor, judge or regrade"})
    return 1 if failures else 0


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
