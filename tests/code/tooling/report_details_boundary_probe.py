"""Observe report availability on job copies; never execute or regrade trials."""
import argparse
from collections import Counter
from contextlib import ExitStack
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]


def save(path, value):
    with path.open("x") as stream:
        json.dump(value, stream, indent=2)


def hashes(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*")) if p.is_file()}


def load_evaluate():
    os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    sys.path.insert(0, str(ROOT))
    spec = importlib.util.spec_from_file_location("evaluate", ROOT / "tests/skills/evaluate.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def guards(stack, evaluate, target, denied, hits):
    read_text = Path.read_text

    def read(path, *args, **kwargs):
        if denied and path == target:
            hits.append(str(path))
            raise PermissionError("Injected reward-details read refusal")
        return read_text(path, *args, **kwargs)

    stack.enter_context(patch.object(Path, "read_text", read))
    stack.enter_context(patch.object(evaluate, "harbor", side_effect=AssertionError("Execution forbidden")))
    stack.enter_context(patch("socket.socket.connect", side_effect=AssertionError("Network forbidden")))
    stack.enter_context(patch("socket.create_connection", side_effect=AssertionError("Network forbidden")))


def render(job, target, mode):
    evaluate = load_evaluate()
    hits, observation = [], {"completed": False}
    sys.argv = ["evaluate.py", "report", str(job)]
    try:
        with ExitStack() as stack:
            guards(stack, evaluate, target, mode == "read-denied", hits)
            code = evaluate.main()
            observation["completed"] = True
            return code
    except Exception as error:
        observation["exception"] = {"type": type(error).__name__, "message": str(error)}
        raise
    finally:
        observation["injectedReads"] = hits
        save(job.parent / "render-observation.json", observation)


def run(ordinary, calibration, output):
    ordinary, calibration, output = ordinary.resolve(), calibration.resolve(), output.resolve()
    for source in (ordinary, calibration):
        assert source.is_dir() and source.with_name(source.name + ".inputs").is_dir()
        assert output != source and source not in output.parents
        assert source.with_name(source.name + ".inputs") not in output.parents
    output.mkdir(parents=True, exist_ok=False)
    evaluate = load_evaluate()
    observations = []
    for kind, source in (("execution", ordinary), ("calibration", calibration)):
        source_inputs = source.with_name(source.name + ".inputs")
        assert (source_inputs / "calibration.json").is_file() == (kind == "calibration")
        source_hashes, input_hashes = hashes(source), hashes(source_inputs)
        original_rows = list(evaluate.native_results(source))
        assert len(original_rows) >= 2, "Keep an unaffected peer to observe the failure scope"
        original_verdicts = {d.name: evaluate.verdict(d, r) for d, r in original_rows}
        if kind == "execution":
            assert all(v in ("passed", "failed") for v in original_verdicts.values())
        target_relative = original_rows[0][0].relative_to(source) / "verifier/reward-details.json"
        assert (source / target_relative).is_file()
        save(output / (kind + "-source.json"), {"source": str(source), "inputs": str(source_inputs),
             "jobHashes": source_hashes, "inputHashes": input_hashes,
             "originalVerdicts": original_verdicts, "target": str(target_relative)})
        for mode in ("normal", "missing", "invalid-json", "read-denied"):
            case = output / (kind + "-" + mode)
            case.mkdir()
            job, inputs = case / "job", case / "job.inputs"
            shutil.copytree(source, job)
            shutil.copytree(source_inputs, inputs)
            target = job / target_relative
            shutil.copy2(target, case / "original-reward-details.json")
            shutil.copy2(job / "summary.md", case / "original-summary.md")
            if mode == "missing":
                target.unlink()
            elif mode == "invalid-json":
                target.write_text('{"reward":')
            before = hashes(job)
            command = [sys.executable, str(Path(__file__).resolve()), "--render",
                       str(job), str(target), mode]
            with (case / "report-command.log").open("x") as log:
                process = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
            render_observation = json.loads((case / "render-observation.json").read_text())
            completed = render_observation["completed"]
            # Observe per-trial classification independently even if rendering
            # aborted. These are not counts returned by the failed report call.
            verdicts, errors, hits = {}, {}, []
            classification_exit = None
            with ExitStack() as stack:
                guards(stack, evaluate, target, mode == "read-denied", hits)
                for directory, result in evaluate.native_results(job):
                    try:
                        verdicts[directory.name] = evaluate.verdict(directory, result)
                    except Exception as error:
                        errors[directory.name] = {"type": type(error).__name__, "message": str(error)}
                if not errors:
                    classification_exit = evaluate.exit_status(job, Counter(verdicts.values()))
            after = hashes(job)
            assert {k: v for k, v in after.items() if k != "summary.md"} == {
                k: v for k, v in before.items() if k != "summary.md"}
            assert hashes(inputs) == input_hashes
            assert all(after.get(k) == v for k, v in source_hashes.items()
                       if k not in (str(target_relative), "summary.md"))
            assert (process.returncode == 0) == completed
            if mode == "read-denied":
                # Calibration reads components for classification as well as
                # rendering; every injected call must target this one file.
                assert render_observation["injectedReads"]
                assert set(render_observation["injectedReads"]) == {str(target)}
            if not completed:
                assert after["summary.md"] == before["summary.md"]
            expected_verdicts = dict(original_verdicts)
            if kind == "calibration" and mode != "normal":
                expected_verdicts[original_rows[0][0].name] = "unscored"
            assert completed and not errors and verdicts == expected_verdicts
            rendered = (job / "summary.md").read_text()
            for trial_name, verdict in verdicts.items():
                result = json.loads((job / trial_name / "result.json").read_text())
                assert f"| {result['task_name']} | {verdict} |" in rendered
            if mode in ("invalid-json", "read-denied"):
                error_type = "JSONDecodeError" if mode == "invalid-json" else "PermissionError"
                assert "Grading details unavailable: " + error_type in rendered
                assert "Native result retained" in rendered
            else:
                assert "Grading details unavailable" not in rendered
            native_scores = {d.name: r.get("verifier_result") for d, r in evaluate.native_results(job)}
            assert native_scores == {d.name: r.get("verifier_result") for d, r in original_rows}
            observation = {"kind": kind, "case": mode, "target": str(target_relative),
                "reportCompleted": completed, "reportCommandExit": process.returncode,
                "renderObservation": render_observation,
                "perTrialVerdicts": verdicts, "classificationErrors": errors,
                "classificationExitFromIndependentVerdicts": classification_exit,
                "classificationInjectedReads": hits, "nativeScores": native_scores,
                "nativeResultBytesPreserved": True, "frozenInputsPreserved": True,
                "summaryDisposition": "newly generated copy" if completed else "unchanged historical copy; not a current report",
                "reportAvailable": completed,
                "changedByReport": [k for k in sorted(before.keys() | after.keys()) if before.get(k) != after.get(k)]}
            save(case / "observation.json", observation)
            observations.append(observation)
            print(kind, mode, "report exit", process.returncode, flush=True)
        assert hashes(source) == source_hashes and hashes(source_inputs) == input_hashes
    save(output / "observations.json", observations)
    unavailable = [r["kind"] + "/" + r["case"] for r in observations if not r["reportAvailable"]]
    save(output / "summary.json", {"cases": len(observations), "unavailableReports": unavailable,
         "originalsPreserved": True, "scope": "Copied artifacts and injected file-read boundary only; no regrade or execution"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ordinary", type=Path)
    parser.add_argument("calibration", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.ordinary, args.calibration, args.output))
