"""Observe calibration manifest reads and legitimate manifest-free controls."""
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


def render(job, mode):
    evaluate = load_evaluate()
    target = job.with_name(job.name + ".inputs") / "calibration.json"
    read_text = Path.read_text
    hits = []
    observed = {"reportCompleted": False, "counts": None, "classificationExit": None}

    def read(path, *args, **kwargs):
        if mode == "read-denied" and path == target:
            hits.append(str(path))
            raise PermissionError("Injected calibration manifest read refusal")
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


def run(calibration, oracle, nop, output):
    sources = {"calibration": calibration.resolve(), "oracle": oracle.resolve(), "nop": nop.resolve()}
    output = output.resolve()
    evaluate = load_evaluate()
    originals, rows_by_kind = {}, {}
    for kind, source in sources.items():
        inputs = source.with_name(source.name + ".inputs")
        assert source.is_dir() and inputs.is_dir()
        assert output not in (source, inputs) and source not in output.parents and inputs not in output.parents
        rows = list(evaluate.native_results(source))
        assert len(rows) == 2
        assert all(r.get("agent_info", {}).get("name") == ("nop" if kind == "nop" else "oracle") for _, r in rows)
        manifest = inputs / "calibration.json"
        assert manifest.is_file() == (kind == "calibration")
        if kind == "calibration":
            assert all(case["label_status"] == "candidate" for case in json.loads(manifest.read_text()).values())
        source_agent = json.loads((inputs / "source.json").read_text())["agent"]
        assert source_agent == ("judge-calibration" if kind == "calibration" else kind)
        expected = {"calibration": "judge-calibration-match", "oracle": "calibration-pass", "nop": "calibration-fail"}[kind]
        assert Counter(evaluate.verdict(d, r) for d, r in rows) == {expected: 2}
        originals[kind] = {"source": str(source), "inputs": str(inputs),
                           "jobHashes": hashes(source), "inputHashes": hashes(inputs)}
        rows_by_kind[kind] = rows
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", originals)
    observations = []
    cases = [("calibration", mode) for mode in ("normal", "missing", "invalid-json", "read-denied")]
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
        target = inputs / "calibration.json"
        if kind == "calibration":
            shutil.copy2(target, case / "original-calibration.json")
        if mode == "missing":
            target.unlink()
        elif mode == "invalid-json":
            target.write_text('{"sample":')
        before, input_before = hashes(job), hashes(inputs)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in before.items() if k != "summary.md"} == {
            k: v for k, v in after.items() if k != "summary.md"}
        assert hashes(inputs) == input_before
        assert all(input_before.get(k) == h for k, h in originals[kind]["inputHashes"].items()
                   if not (k == "calibration.json" and mode in ("missing", "invalid-json")))
        for directory, _ in rows_by_kind[kind]:
            relative = directory.relative_to(source) / "result.json"
            assert (job / relative).read_bytes() == (source / relative).read_bytes()
        completed = observed["reportCompleted"]
        included = None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            included = all(f"| {r['task_name']} |" in summary for _, r in rows_by_kind[kind])
            assert included
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert before["summary.md"] == after["summary.md"]
        if mode == "normal":
            expected = {"calibration": "judge-calibration-match", "oracle": "calibration-pass", "nop": "calibration-fail"}[kind]
            assert completed and observed["counts"] == {expected: 2} and observed["classificationExit"] == 0
            assert "Calibration expectations unavailable" not in summary
        else:
            assert completed and observed["counts"] == {"unscored": 2}
            assert observed["classificationExit"] == 1
            assert all(f"| {r['task_name']} | unscored |" in summary for _, r in rows_by_kind[kind])
            assert "Calibration expectations unavailable" in summary
            assert "no expected scores inferred" in summary
            assert "expected components" not in summary
            error_type = {"missing": "FileNotFoundError", "invalid-json": "JSONDecodeError",
                          "read-denied": "PermissionError"}[mode]
            assert error_type in summary
            if mode == "missing":
                assert "source.json agent=judge-calibration" in summary
        if mode == "read-denied":
            assert observed["injectedReads"] and set(observed["injectedReads"]) == {str(target)}
        observation = {"case": name, **observed, "reportCommandExit": result.returncode,
            "sourceOriginallyHadManifest": kind == "calibration", "nativeResultsPreserved": True,
            "trialRowsIncludedInCurrentReport": included, "reportDidNotChangeInputs": True,
            "inputFault": mode if mode in ("missing", "invalid-json") else None,
            "otherSnapshotFilesPreserved": True,
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
         "scope": "Four manifest read controls and two originally manifest-free controls; no execution or regrade"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), sys.argv[3]))
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("calibration", "oracle", "nop", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    raise SystemExit(run(args.calibration, args.oracle, args.nop, args.output))
