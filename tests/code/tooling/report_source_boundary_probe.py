"""Offline calibration/read-error observations; exit 1 retains unmet expectations."""
import argparse
from contextlib import ExitStack, redirect_stdout
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import traceback
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]


def hashes(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*")) if p.is_file()}


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def run(source, output):
    source, output = source.resolve(), output.resolve()
    inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and inputs.is_dir()
    assert source not in output.parents and inputs not in output.parents
    output.mkdir(parents=True, exist_ok=False)
    original = {"job": hashes(source), "inputs": hashes(inputs)}
    save(output / "source-before.json", original)
    cases = json.loads((inputs / "calibration.json").read_text())
    assert cases and not (inputs / "skills").exists()
    sample = sorted(cases)[0]
    verifier_file = Path("samples") / sample / "tests/judge.toml"
    assert (inputs / verifier_file).is_file()
    support_file = sorted((inputs / "support").glob("*.py"))[0].relative_to(inputs)
    baseline, baseline_inputs = output / "baseline", output / "baseline.inputs"
    shutil.copytree(source, baseline)
    shutil.copytree(inputs, baseline_inputs)
    os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    spec = importlib.util.spec_from_file_location("evaluate", ROOT / "tests/skills/evaluate.py")
    evaluate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(evaluate)
    original_verdicts = {p.name: evaluate.verdict(p, result) for p, result in evaluate.native_results(source)}
    read_bytes, rglob = Path.read_bytes, Path.rglob
    observations = []
    for name in ("same", "sample-changed", "sample-missing", "file-read-error", "directory-iteration-error"):
        case = output / name
        case.mkdir()
        job, saved = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(inputs, saved)
        if name == "sample-changed":
            with (saved / verifier_file).open("ab") as stream:
                stream.write(b"\n# Saved-input comparison control; never executed.\n")
        elif name == "sample-missing":
            (saved / verifier_file).unlink()
        expected = {"Shared support": "matched", "Dependency lock": "matched",
                    "Image identity": "matched", "Task verifier inputs": "matched", "skills": "unavailable"}
        if name in ("sample-changed", "sample-missing", "directory-iteration-error"):
            expected["Task verifier inputs"] = "mismatched" if name == "sample-changed" else "unavailable"
        if name == "file-read-error":
            expected["Shared support"] = "unavailable"
        before, saved_before = hashes(job), hashes(saved)
        hits = []

        def denied_read(path):
            if path == saved / support_file:
                hits.append({"operation": "read_bytes", "path": str(path)})
                raise PermissionError("Injected saved support read failure")
            return read_bytes(path)

        def denied_iteration(path, *args, **kwargs):
            if path == saved / verifier_file.parent:
                hits.append({"operation": "rglob iteration", "path": str(path)})
                raise PermissionError("Injected sample verifier directory traversal failure")
            yield from rglob(path, *args, **kwargs)

        error, counts, completed = None, None, False
        captured = io.StringIO()
        with ExitStack() as stack:
            stack.enter_context(patch.object(evaluate, "harbor", side_effect=AssertionError("Execution forbidden")))
            stack.enter_context(redirect_stdout(captured))
            if name == "file-read-error":
                stack.enter_context(patch.object(Path, "read_bytes", denied_read))
            if name == "directory-iteration-error":
                stack.enter_context(patch.object(Path, "rglob", denied_iteration))
            try:
                counts = dict(evaluate.report(job, baseline))
                completed = True
            except Exception as exception:
                error = {"type": type(exception).__name__, "message": str(exception)}
                (case / "exception.log").write_text(traceback.format_exc())
        (case / "stdout.log").write_text(captured.getvalue())
        if "error" in name:
            assert len(hits) == 1, (name, hits)
        actual = {}
        report = (job / "summary.md").read_text() if completed else None
        if report is not None:
            for label in expected.keys() - {"skills"}:
                matches = [line.split("|")[2].strip() for line in report.splitlines()
                           if line.startswith("| " + label + " |")]
                actual[label] = matches[0] if len(matches) == 1 else None
            prefix = "Saved Skill content (separate candidate dimension): "
            matches = [line[len(prefix):].removesuffix(".") for line in report.splitlines() if line.startswith(prefix)]
            actual["skills"] = matches[0] if len(matches) == 1 else None
        after = hashes(job)
        assert {k: v for k, v in before.items() if k != "summary.md"} == {
            k: v for k, v in after.items() if k != "summary.md"}
        assert hashes(saved) == saved_before
        assert hashes(baseline) == original["job"] and hashes(baseline_inputs) == original["inputs"]
        assert {p.name: evaluate.verdict(p, result) for p, result in evaluate.native_results(job)} == original_verdicts
        observation = {"case": name, "expectedStatuses": expected, "actualStatuses": actual,
                       "reportCompleted": completed, "expectationMet": completed and actual == expected,
                       "exception": error, "injectedCalls": hits, "counts": counts,
                       "summaryDisposition": "new report" if completed else "copied historical summary; not newly generated",
                       "jobEffects": {k: {"before": before.get(k), "after": after.get(k)}
                                      for k in sorted(before.keys() | after.keys()) if before.get(k) != after.get(k)},
                       "originalVerdicts": original_verdicts, "nativeFilesPreserved": True,
                       "savedInputChanges": {k: {"before": original["inputs"].get(k), "after": saved_before.get(k)}
                                             for k in sorted(original["inputs"].keys() | saved_before.keys())
                                             if original["inputs"].get(k) != saved_before.get(k)}}
        save(case / "observation.json", observation)
        observations.append(observation)
    assert hashes(source) == original["job"] and hashes(inputs) == original["inputs"]
    save(output / "observations.json", observations)
    unmet = [row["case"] for row in observations if not row["expectationMet"]]
    print(json.dumps({"cases": len(observations), "unmetExpectations": unmet, "originalFilesPreserved": True}))
    return bool(unmet)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New output directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
