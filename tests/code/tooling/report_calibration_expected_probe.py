"""Observe incomplete expected components, including a paired missing-detail control."""
import argparse
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
    assert all(case["label_status"] == "candidate" and set(case["expected"]) == {"checks", "judge"}
               for case in manifest.values())
    target_name, peer_name = rows[0][1]["task_name"], rows[1][1]["task_name"]
    details_relative = rows[0][0].relative_to(source) / "verifier/reward-details.json"
    assert (source / details_relative).is_file()
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(source_inputs),
         "jobHashes": original, "inputHashes": original_inputs, "target": target_name, "peer": peer_name})
    modes = ("normal", "empty-expected", "missing-checks", "missing-judge",
             "complete-expected-missing-details", "empty-expected-missing-details")
    observations = []
    for mode in modes:
        case = output / mode
        case.mkdir()
        job, inputs = case / "job", case / "job.inputs"
        shutil.copytree(source, job)
        shutil.copytree(source_inputs, inputs)
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        shutil.copy2(inputs / "calibration.json", case / "original-calibration.json")
        shutil.copy2(job / details_relative, case / "original-reward-details.json")
        altered = copy.deepcopy(manifest)
        if mode.startswith("empty-expected"):
            altered[target_name]["expected"] = {}
        elif mode == "missing-checks":
            del altered[target_name]["expected"]["checks"]
        elif mode == "missing-judge":
            del altered[target_name]["expected"]["judge"]
        if altered != manifest:
            (inputs / "calibration.json").write_text(json.dumps(altered, indent=2) + "\n")
        if mode.endswith("missing-details"):
            (job / details_relative).unlink()
        assert altered[peer_name] == manifest[peer_name]
        assert all(item["label_status"] == "candidate" for item in altered.values())
        before, input_before = hashes(job), hashes(inputs)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), mode]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        after = hashes(job)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {
            k: v for k, v in before.items() if k != "summary.md"}
        assert all(after.get(k) == h for k, h in original.items() if k not in (str(details_relative), "summary.md"))
        assert hashes(inputs) == input_before
        assert all(input_before.get(k) == h for k, h in original_inputs.items() if k != "calibration.json")
        for directory, _ in rows:
            assert (job / directory.name / "result.json").read_bytes() == (directory / "result.json").read_bytes()
        assert evaluate.verdict(job / rows[1][0].name, rows[1][1]) == "judge-calibration-match"
        completed = observed["reportCompleted"]
        target_verdict, peer_visible = None, None
        if completed:
            assert result.returncode == 0
            summary = (job / "summary.md").read_text()
            peer_visible = f"| {peer_name} | judge-calibration-match |" in summary
            assert peer_visible
            target_verdict = next(line.split("|")[2].strip() for line in summary.splitlines()
                                  if line.startswith(f"| {target_name} |"))
        else:
            assert result.returncode != 0
            assert observed["counts"] is None and observed["classificationExit"] is None
            assert after["summary.md"] == original["summary.md"]
        if mode == "normal":
            assert completed and observed["counts"] == {"judge-calibration-match": 2}
            assert observed["classificationExit"] == 0
        else:
            assert completed and observed["counts"] == {"judge-calibration-match": 1, "unscored": 1}
            assert target_verdict == "unscored" and observed["classificationExit"] == 1
            if mode != "complete-expected-missing-details":
                missing = sorted({"checks", "judge"} - altered[target_name]["expected"].keys())
                assert f"missing expected components {', '.join(missing)} for {evaluate.diagnostic_text(target_name)}" in summary
                assert "no expected scores inferred" in summary
        expected_keys = sorted(altered[target_name]["expected"])
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "expectedKeys": expected_keys, "targetVerdictInReport": target_verdict,
            "targetDetailsPresent": (job / details_relative).is_file(),
            "incompleteExpectedMatched": expected_keys != ["checks", "judge"] and target_verdict == "judge-calibration-match",
            "peerEntryUnchanged": True, "peerIncludedInCurrentReport": peer_visible,
            "originalNativeScoresPreserved": True, "reportDidNotMutateInputs": True,
            "otherFrozenInputFilesPreserved": True, "originalLabelsPreserved": True,
            "summaryDisposition": "newly generated copy" if completed else "historical copy only; no new report"}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, "target", target_verdict, flush=True)
    assert hashes(source) == original and hashes(source_inputs) == original_inputs
    save(output / "observations.json", observations)
    by_case = {o["case"]: o for o in observations}
    bypassed = (by_case["complete-expected-missing-details"]["targetVerdictInReport"] == "unscored"
                and by_case["empty-expected-missing-details"]["targetVerdictInReport"] == "judge-calibration-match")
    unavailable = [o["case"] for o in observations if not o["reportCompleted"]]
    incomplete_matches = [o["case"] for o in observations if o["incompleteExpectedMatched"]]
    save(output / "summary.json", {"cases": 6, "unavailableReports": unavailable,
         "incompleteExpectedMatches": incomplete_matches, "unscorableBypassed": bypassed,
         "originalJobAndFrozenInputsPreserved": True,
         "scope": "Four expected-component controls plus a paired missing-detail comparison; no execution or regrade"})
    return 1 if unavailable or incomplete_matches or bypassed else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        raise SystemExit(render(Path(sys.argv[2]), sys.argv[3]))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
