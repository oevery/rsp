"""Observe bounded calibration manifest omissions on preserved job copies."""
import argparse
from collections import Counter
import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys

from report_calibration_boundary_probe import render
from report_details_boundary_probe import ROOT, hashes, load_evaluate, save


def run(source, output):
    source, output = source.resolve(), output.resolve()
    source_inputs = source.with_name(source.name + ".inputs")
    assert source.is_dir() and source_inputs.is_dir()
    assert output not in (source, source_inputs) and source not in output.parents and source_inputs not in output.parents
    evaluate = load_evaluate()
    rows = list(evaluate.native_results(source))
    assert len(rows) == 2 and all(evaluate.verdict(d, r) == "judge-calibration-match" for d, r in rows)
    original, original_inputs = hashes(source), hashes(source_inputs)
    manifest = json.loads((source_inputs / "calibration.json").read_text())
    assert set(manifest) == {r["task_name"] for _, r in rows}
    assert all(case["label_status"] == "candidate" for case in manifest.values())
    target_name, peer_name = rows[0][1]["task_name"], rows[1][1]["task_name"]
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(source_inputs),
         "jobHashes": original, "inputHashes": original_inputs, "target": target_name, "peer": peer_name})
    observations = []
    for mode in ("normal", "missing-entry", "missing-expected", "missing-label-status"):
        case = output / mode
        case.mkdir()
        job, inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(source_inputs, inputs)
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        shutil.copy2(inputs / "calibration.json", case / "original-calibration.json")
        altered = copy.deepcopy(manifest)
        if mode == "missing-entry":
            del altered[target_name]
        elif mode == "missing-expected":
            del altered[target_name]["expected"]
        elif mode == "missing-label-status":
            del altered[target_name]["label_status"]
        if mode != "normal":
            (inputs / "calibration.json").write_text(json.dumps(altered, indent=2) + "\n")
        assert altered[peer_name] == manifest[peer_name]
        input_before = hashes(inputs)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in original.items() if k != "summary.md"}
        assert hashes(inputs) == input_before
        assert all(input_before.get(k) == h for k, h in original_inputs.items() if k != "calibration.json")
        independent = {}
        for directory, value in rows:
            copied = job / directory.name
            assert (copied / "result.json").read_bytes() == (directory / "result.json").read_bytes()
            try:
                independent[value["task_name"]] = {"verdict": evaluate.verdict(copied, value)}
            except Exception as error:
                independent[value["task_name"]] = {"exception": {"type": type(error).__name__, "message": str(error)}}
        assert independent[peer_name] == {"verdict": "judge-calibration-match"}
        independent_exit = None
        if all("verdict" in item for item in independent.values()):
            independent_exit = evaluate.exit_status(job, Counter(item["verdict"] for item in independent.values()))
        completed = observed["reportCompleted"]
        peer_visible, label_lines = None, None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            peer_visible = f"| {peer_name} | judge-calibration-match |" in summary
            assert peer_visible
            label_lines = [line.strip() for line in summary.splitlines() if line.strip().startswith("Judge calibration:")]
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert after["summary.md"] == original["summary.md"]
        if mode == "normal":
            assert completed and observed["counts"] == {"judge-calibration-match": 2}
            assert observed["classificationExit"] == 0
            assert len(label_lines) == 2 and all(line.startswith("Judge calibration: candidate;") for line in label_lines)
        elif mode in ("missing-entry", "missing-expected"):
            assert completed and observed["counts"] == {"unscored": 1, "judge-calibration-match": 1}
            assert observed["classificationExit"] == 1 and independent_exit == 1
            assert independent[target_name] == {"verdict": "unscored"}
            assert f"| {target_name} | unscored |" in summary
            reason = "missing sample entry" if mode == "missing-entry" else "missing expected"
            assert f"calibration.json: {reason} for {evaluate.diagnostic_text(target_name)}" in summary
            assert "no expected scores inferred" in summary
            assert len(label_lines) == 1 and label_lines[0].startswith("Judge calibration: candidate;")
        else:
            assert completed and observed["counts"] == {"judge-calibration-match": 2}
            assert observed["classificationExit"] == 0 and independent_exit == 0
            assert len(label_lines) == 2
            assert sum(line.startswith("Judge calibration: candidate;") for line in label_lines) == 1
            assert sum(line.startswith("Judge calibration: unknown;") for line in label_lines) == 1
            assert "Label status unknown: label_status is missing" in summary
            assert "neither candidate nor human confirmation is inferred" in summary
        target = altered.get(target_name)
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "independentVerdicts": independent, "independentClassificationExit": independent_exit,
            "targetEntryPresent": target is not None,
            "targetLabelPresent": target is not None and "label_status" in target,
            "targetLabelValue": target.get("label_status") if target is not None else None,
            "peerEntryUnchanged": True, "nativeScoresAndJobEvidencePreserved": True,
            "otherFrozenInputFilesPreserved": True, "reportDidNotMutateInputs": True,
            "peerIncludedInCurrentReport": peer_visible, "labelsDisplayedInCurrentReport": label_lines,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, flush=True)
    assert hashes(source) == original and hashes(source_inputs) == original_inputs
    save(output / "observations.json", observations)
    unavailable = [o["case"] for o in observations if not o["reportCompleted"]]
    save(output / "summary.json", {"cases": 4, "unavailableReports": unavailable,
         "originalJobAndFrozenInputsPreserved": True,
         "scope": "Three specified manifest omissions and normal control only; no execution or regrade"})
    return 1 if unavailable else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), sys.argv[3]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
