"""Offline saved-source report controls; never execute agents or judges."""
import argparse
from contextlib import redirect_stdout
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(root):
    return {str(p.relative_to(root)): digest(p) for p in sorted(root.rglob("*"))
            if p.is_file()}


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def evidence(inputs, required):
    """Fixture oracle: missing any required member is unavailable, not empty/equal."""
    result = {}
    for name, paths in required.items():
        result[name] = ({path: digest(inputs / path) for path in paths}
                        if paths and all((inputs / path).is_file() for path in paths) else None)
    source = inputs / "source.json"
    result["image"] = json.loads(source.read_text()).get("image") if source.is_file() else None
    return result


def state(before, after):
    return "unavailable" if before is None or after is None else "matched" if before == after else "mismatched"


def run(source, output):
    source = source.resolve()
    output = output.resolve()
    inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and inputs.is_dir()
    assert output != source and source not in output.parents and inputs not in output.parents
    output.mkdir(parents=True, exist_ok=False)
    original = {"job": inventory(source), "inputs": inventory(inputs)}
    write(output / "source-before.json", original)
    tasks = json.loads((inputs / "source.json").read_text())["tasks"]
    required = {
        "support": sorted(str(p.relative_to(inputs)) for p in (inputs / "support").rglob("*.py")),
        "dependency": ["uv.lock"],
        "verifier": sorted(str(p.relative_to(inputs)) for task in tasks
                           for p in (inputs / "tasks" / task / "tests").rglob("*") if p.is_file()),
        "skills": sorted(str(p.relative_to(inputs)) for p in (inputs / "skills").rglob("*") if p.is_file()),
    }
    assert all(required.values()), "Use a retained Skill job with verifier and support inputs"
    baseline = output / "baseline"
    baseline_inputs = output / "baseline.inputs"
    shutil.copytree(source, baseline)
    shutil.copytree(inputs, baseline_inputs)
    expected_before = evidence(baseline_inputs, required)
    assert all(value is not None for value in expected_before.values())
    write(output / "required-inputs.json", required)
    os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    spec = importlib.util.spec_from_file_location("evaluate", ROOT / "tests/skills/evaluate.py")
    evaluate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(evaluate)
    cases = [("same", None, None)] + [(name + "-" + action, name, action)
             for name in ("support", "dependency", "image", "verifier", "skills")
             for action in ("changed", "missing")]
    observations = []
    control_lines = None
    execution_lines = None
    with patch.object(evaluate, "harbor", side_effect=AssertionError("Execution forbidden")):
        for name, dimension, action in cases:
            case = output / name
            case.mkdir()
            job, saved = case / "job", case / "job.inputs"
            shutil.copytree(source, job)
            shutil.copytree(inputs, saved)
            if dimension == "image":
                path = saved / "source.json"
                value = json.loads(path.read_text())
                if action == "missing":
                    del value["image"]
                else:
                    value["image"] = "synthetic-changed-image"
                write(path, value)
            elif dimension:
                path = saved / required[dimension][0]
                if action == "missing":
                    path.unlink()
                else:
                    with path.open("ab") as stream:
                        stream.write(b"\n# Offline provenance control only; never executed.\n")
            expected_after = evidence(saved, required)
            classification = {key: state(value, expected_after[key]) for key, value in expected_before.items()}
            assert classification == {key: ("mismatched" if action == "changed" else "unavailable")
                                      if key == dimension else "matched" for key in expected_before}
            before_job = inventory(job)
            before_inputs = inventory(saved)
            with redirect_stdout(io.StringIO()) as captured:
                counts = evaluate.report(job, baseline)
            (case / "report-stdout.log").write_text(captured.getvalue())
            report = (job / "summary.md").read_text()
            comparison = report.split("\nBaseline: ", 1)[1].splitlines()[1:]
            if control_lines is None:
                control_lines = comparison
            actual = {}
            for key, label in (("support", "Shared support"), ("dependency", "Dependency lock"),
                               ("image", "Image identity"), ("verifier", "Task verifier inputs")):
                matches = [line.split("|")[2].strip() for line in report.splitlines()
                           if line.startswith("| " + label + " |")]
                actual[key] = matches[0] if len(matches) == 1 else None
            prefix = "Saved Skill content (separate candidate dimension): "
            matches = [line[len(prefix):].removesuffix(".") for line in report.splitlines() if line.startswith(prefix)]
            actual["skills"] = matches[0] if len(matches) == 1 else None
            execution = report.split("### Recorded execution comparison\n", 1)[-1]
            if execution_lines is None:
                execution_lines = execution
            after_job = inventory(job)
            assert {k: v for k, v in before_job.items() if k != "summary.md"} == {
                k: v for k, v in after_job.items() if k != "summary.md"}
            assert inventory(saved) == before_inputs
            assert inventory(baseline) == original["job"]
            assert inventory(baseline_inputs) == original["inputs"]
            observation = {"case": name, "sourceStatus": {k: v for k, v in classification.items() if k != "skills"},
                           "skillStatus": classification["skills"], "before": expected_before, "after": expected_after,
                           "actualCounts": dict(counts), "actualComparison": comparison,
                           "actualStatuses": actual, "statusesMatchExpectations": actual == classification,
                           "recordedExecutionUnchanged": execution == execution_lines,
                           "comparisonSameAsUnchangedControl": comparison == control_lines,
                           "copiedNativeFilesPreserved": True, "copiedInputsPreservedAfterReport": True}
            write(case / "observation.json", observation)
            assert actual == classification, (name, actual, classification)
            assert execution == execution_lines, "Saved-input changes must not rewrite recorded execution identity"
            assert "not original execution identity" in report
            assert "Skill variation alone does not make a candidate comparison incompatible" in report
            observations.append({k: v for k, v in observation.items() if k not in ("before", "after")})
    assert inventory(source) == original["job"] and inventory(inputs) == original["inputs"]
    write(output / "observations.json", observations)
    print(json.dumps({"cases": len(observations), "originalFilesPreserved": True,
                      "unchangedComparisonCases": [o["case"] for o in observations if o["comparisonSameAsUnchangedControl"]]}))
    return observations


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New output directory; existing paths are rejected")
    args = parser.parse_args()
    run(args.source, args.output)
