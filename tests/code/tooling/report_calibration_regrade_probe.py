"""Inspect retained regrade reports; never invoke regrade or a judge."""
import argparse
from collections import Counter
import json
from pathlib import Path
import shutil
import subprocess
import sys

from report_calibration_boundary_probe import render
from report_details_boundary_probe import ROOT, hashes, load_evaluate, save


def run(calibration, ordinary, output):
    sources = {"calibration": calibration.resolve(), "ordinary": ordinary.resolve()}
    output = output.resolve()
    evaluate = load_evaluate()
    originals, identities, referenced_roots = {}, {}, set()
    for kind, source in sources.items():
        inputs = source.with_name(source.name + ".inputs")
        assert source.is_dir() and inputs.is_dir()
        assert output not in (source, inputs) and source not in output.parents and inputs not in output.parents
        assert json.loads((inputs / "source.json").read_text())["agent"] == "regrade"
        manifest = inputs / "calibration.json"
        assert manifest.is_file() == (kind == "calibration")
        if kind == "calibration":
            assert all(case["label_status"] == "candidate" for case in json.loads(manifest.read_text()).values())
        rows = list(evaluate.native_results(source))
        assert rows
        assert json.loads((source / "result.json").read_text())["n_total_trials"] == len(rows)
        expected = "judge-calibration-regrade-match" if kind == "calibration" else "regrade-pass"
        assert Counter(evaluate.verdict(d, r) for d, r in rows) == {expected: len(rows)}
        identity = []
        for _, result in rows:
            origin = result["config"]["source_trial"]
            assert origin["action"] == "regrade" and origin["type"] == "local"
            source_trial = Path(origin["path"]).resolve()
            assert (source_trial / "result.json").is_file()
            source_job = source_trial.parent
            source_inputs = source_job.with_name(source_job.name + ".inputs")
            assert source_inputs.is_dir()
            referenced_roots.update((source_job, source_inputs))
            source_agent = json.loads((source_inputs / "source.json").read_text())["agent"]
            assert source_agent == ("judge-calibration" if kind == "calibration" else "codex")
            identity.append({"task": result["task_name"], "sourceAction": origin["action"],
                "sourceTrial": str(source_trial), "sourceSavedAgent": source_agent,
                "sourceHasCalibrationManifest": (source_inputs / "calibration.json").is_file(),
                "savedSampleDirectoryPresent": (inputs / "samples" / result["task_name"]).is_dir()})
        originals[kind] = {"source": str(source), "inputs": str(inputs), "trials": len(rows),
                           "jobHashes": hashes(source), "inputHashes": hashes(inputs)}
        identities[kind] = identity
    for root in referenced_roots:
        assert output != root and root not in output.parents
    referenced = {str(root): hashes(root) for root in referenced_roots}
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", originals)
    save(output / "identity-evidence.json", identities)
    save(output / "referenced-source-before.json", referenced)
    observations = []
    for kind, mode in (("calibration", "normal"), ("calibration", "missing"), ("ordinary", "normal")):
        name = f"{kind}-{mode}"
        case = output / name
        case.mkdir()
        source = sources[kind]
        job, inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(source.with_name(source.name + ".inputs"), inputs)
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        manifest = inputs / "calibration.json"
        if manifest.is_file():
            shutil.copy2(manifest, case / "original-calibration.json")
        if mode == "missing":
            manifest.unlink()
        input_before = hashes(inputs)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        original = originals[kind]
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in original["jobHashes"].items() if k != "summary.md"}
        assert hashes(inputs) == input_before
        assert all(input_before.get(k) == h for k, h in original["inputHashes"].items()
                   if not (mode == "missing" and k == "calibration.json"))
        completed = observed["reportCompleted"]
        inherited_visible = None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            inherited_visible = "source executor (inherited)" in summary and "Source trial:" in summary
            assert inherited_visible
            assert all(f"| {item['task']} |" in summary for item in identities[kind])
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert after["summary.md"] == original["jobHashes"]["summary.md"]
        if mode == "normal":
            expected = "judge-calibration-regrade-match" if kind == "calibration" else "regrade-pass"
            assert completed and observed["counts"] == {expected: original["trials"]}
            assert observed["classificationExit"] == 0
        else:
            assert completed and observed["counts"] == {"unscored": original["trials"]}
            assert observed["classificationExit"] == 1
            assert "Calibration expectations unavailable" in summary
            assert "local regrade source" in summary
            assert "matching task name and saved source.json agent=judge-calibration" in summary
            assert "no expected scores inferred" in summary
            assert "expected components" not in summary
        degraded = completed and kind == "calibration" and any(
            observed["counts"].get(status, 0) for status in ("calibration-pass", "calibration-fail", "regrade-pass", "regrade-fail", "passed", "failed"))
        observation = {"case": name, **observed, "reportCommandExit": result.returncode,
            "savedAgent": "regrade", "originalManifestPresent": kind == "calibration",
            "sourceIdentityEvidence": identities[kind], "calibrationIdentityDegraded": degraded,
            "inheritedSourceMetadataDisplayed": inherited_visible, "nativeScoresAndEvidencePreserved": True,
            "reportDidNotMutateInputs": True, "otherSnapshotFilesPreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(name, "report exit", result.returncode, "identity degraded", degraded, flush=True)
    for kind, source in sources.items():
        assert hashes(source) == originals[kind]["jobHashes"]
        assert hashes(source.with_name(source.name + ".inputs")) == originals[kind]["inputHashes"]
    assert all(hashes(Path(root)) == values for root, values in referenced.items())
    save(output / "observations.json", observations)
    unavailable = [o["case"] for o in observations if not o["reportCompleted"]]
    degraded = [o["case"] for o in observations if o["calibrationIdentityDegraded"]]
    save(output / "summary.json", {"cases": 3, "unavailableReports": unavailable, "identityDegraded": degraded,
         "originalJobsAndFrozenInputsPreserved": True, "referencedSourceJobsPreserved": True,
         "scope": "Report existing regrade results only; no execution, regrade, or judge"})
    return 1 if unavailable or degraded else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), sys.argv[3]))
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("calibration", "ordinary", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    raise SystemExit(run(args.calibration, args.ordinary, args.output))
