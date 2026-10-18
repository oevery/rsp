"""Observe execution-status reads on preserved job copies without execution."""
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
    observed = {"reportCompleted": False, "counts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if mode == "read-denied" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected evaluation-status read refusal")
        return read_text(path, *args, **kwargs)

    sys.argv = ["evaluate.py", "report", str(job)]
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
            observed["counts"] = counts
            observed["classificationExit"] = evaluate.exit_status(job, counts)
            return code
    except Exception as error:
        observed["exception"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        observed["injectedReads"] = hits
        save(job.parent / "render-observation.json", observed)


def run(execution, oracle, nop, output):
    sources = {"execution": execution.resolve(), "oracle": oracle.resolve(), "nop": nop.resolve()}
    output = output.resolve()
    evaluate = load_evaluate()
    originals, source_rows = {}, {}
    statuses = {"execution": "passed", "oracle": "calibration-pass", "nop": "calibration-fail"}
    for kind, source in sources.items():
        inputs = source.with_name(source.name + ".inputs")
        assert source.is_dir() and inputs.is_dir()
        assert output not in (source, inputs) and source not in output.parents and inputs not in output.parents
        assert not (inputs / "calibration.json").exists()
        rows = list(evaluate.native_results(source))
        assert len(rows) == 2
        assert all(r.get("agent_info", {}).get("name") == ("codex" if kind == "execution" else kind) for _, r in rows)
        assert Counter(evaluate.verdict(d, r) for d, r in rows) == {statuses[kind]: 2}
        assert json.loads((source / "result.json").read_text())["n_total_trials"] == 2
        source_rows[kind] = rows
        originals[kind] = {"source": str(source), "inputs": str(inputs),
                           "jobHashes": hashes(source), "inputHashes": hashes(inputs)}
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", originals)
    observations = []
    cases = [("execution", mode) for mode in ("normal", "missing", "invalid-json", "read-denied")]
    cases += [("oracle", "normal"), ("nop", "normal")]
    for kind, mode in cases:
        name = f"{kind}-{mode}"
        case = output / name
        case.mkdir()
        source = sources[kind]
        job, inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(source.with_name(source.name + ".inputs"), inputs)
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        rows = source_rows[kind]
        target_relative = rows[0][0].relative_to(source) / "verifier/evaluation-status.json"
        peer_relative = rows[1][0].relative_to(source) / "result.json"
        target = job / target_relative
        if kind == "execution":
            assert list((job / rows[0][0].name).rglob("evaluation-status.json")) == [target]
        if target.is_file():
            shutil.copy2(target, case / "original-evaluation-status.json")
        if mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"semantic":')
        before = hashes(job)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), str(target), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in before.items() if k != "summary.md"} == {
            k: v for k, v in after.items() if k != "summary.md"}
        assert all(after.get(k) == h for k, h in originals[kind]["jobHashes"].items()
                   if k not in (str(target_relative), "summary.md"))
        assert hashes(inputs) == originals[kind]["inputHashes"]
        for directory, _ in rows:
            relative = directory.relative_to(source) / "result.json"
            assert (job / relative).read_bytes() == (source / relative).read_bytes()
        peer_result = json.loads((job / peer_relative).read_text())
        peer_verdict = evaluate.verdict((job / peer_relative).parent, peer_result)
        assert peer_verdict == statuses[kind]
        completed = observed["reportCompleted"]
        peer_in_report = None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            peer_in_report = f"| {peer_result['task_name']} | {peer_verdict} |" in summary
            assert peer_in_report
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert before["summary.md"] == after["summary.md"]
        if mode in ("normal", "missing"):
            assert completed and observed["counts"] == {statuses[kind]: 2}
            assert observed["classificationExit"] == 0
            assert "Execution mode unavailable" not in summary
        else:
            assert completed and observed["counts"] == {"passed": 1, "unscored": 1}
            assert observed["classificationExit"] == 1
            assert f"| {rows[0][1]['task_name']} | unscored |" in summary
            assert "Execution mode unavailable" in summary
            assert evaluate.diagnostic_text(target_relative) in summary
            assert ("JSONDecodeError" if mode == "invalid-json" else "PermissionError") in summary
            assert "Native scores retained; trial is unscored" in summary
        if mode == "read-denied":
            assert set(observed["injectedReads"]) == {str(target)}
        observation = {"case": name, **observed, "reportCommandExit": result.returncode,
            "target": str(target_relative), "peer": str(peer_relative),
            "nativeResultsPreserved": True, "frozenInputsPreserved": True,
            "peerVerdictIndependentlyObserved": peer_verdict, "peerIncludedInCurrentReport": peer_in_report,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(name, "report exit", result.returncode, flush=True)
    for kind, source in sources.items():
        assert hashes(source) == originals[kind]["jobHashes"]
        assert hashes(source.with_name(source.name + ".inputs")) == originals[kind]["inputHashes"]
    save(output / "observations.json", observations)
    unavailable = [r["case"] for r in observations if not r["reportCompleted"]]
    save(output / "summary.json", {"cases": 6, "unavailableReports": unavailable,
         "originalJobsAndFrozenInputsPreserved": True,
         "scope": "Execution-status read boundary plus unmodified oracle/nop controls; no execution or regrade"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]))
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("execution", "oracle", "nop", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    raise SystemExit(run(args.execution, args.oracle, args.nop, args.output))
