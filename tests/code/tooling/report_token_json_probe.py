"""Observe corrupted token JSON lines on retained job copies, without execution."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys

from report_details_boundary_probe import ROOT, hashes, load_evaluate, save
from report_usage_boundary_probe import render

FIELDS = ("input_tokens", "cached_input_tokens", "output_tokens")


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
    usages = {d.name: evaluate.session_usage(d / "agent") for d, _ in rows}
    assert all(u["status"] == "complete" for u in usages.values())
    target_usage = usages[target_trial.name]
    # This retained fixture has one root session; no child totals are inferred.
    assert len(target_usage["sessions"]) == 1
    session = target_usage["sessions"][0]
    assert session["id"] == target_usage["root"]
    selected = Path(session["path"])
    relative = selected.relative_to(source)
    lines = selected.read_bytes().splitlines(keepends=True)
    events = [json.loads(line) for line in lines]
    token_indices = [i for i, e in enumerate(events) if e.get("type") == "event_msg"
                     and e.get("payload", {}).get("type") == "token_count"]
    assert len(token_indices) >= 2
    previous = events[token_indices[-2]]["payload"]["info"]["total_token_usage"]
    earlier = {k: previous[k] for k in FIELDS}
    assert earlier != target_usage["total"]
    original, original_inputs = hashes(source), hashes(inputs)
    output.mkdir(parents=True, exist_ok=False)
    save(output / "source-before.json", {"source": str(source), "inputs": str(inputs),
         "jobHashes": original, "inputHashes": original_inputs, "usageBeforeMutation": usages,
         "session": str(relative), "originalTokenLines": [i + 1 for i in token_indices],
         "earlierCumulativeUsage": earlier})
    observations = []
    for mode in ("normal", "last-token-invalid-json", "only-token-invalid-json"):
        case = output / mode
        case.mkdir()
        job = case / "job"
        shutil.copytree(source, job)
        shutil.copytree(inputs, case / "job.inputs")
        shutil.copy2(job / "summary.md", case / "original-summary.md")
        shutil.copy2(selected, case / "original-session.jsonl")
        target = job / relative
        removed = token_indices[:-1] if mode == "only-token-invalid-json" else []
        constructed = [(i, line) for i, line in enumerate(lines) if i not in removed]
        with (case / "constructed-before-corruption.jsonl").open("xb") as stream:
            stream.write(b"".join(line for _, line in constructed))
        if mode != "normal":
            # Remove only the last closing brace of the final token JSON line.
            broken = []
            for i, line in constructed:
                if i == token_indices[-1]:
                    position = line.rfind(b"}")
                    assert position >= 0
                    line = line[:position] + line[position + 1:]
                broken.append(line)
            target.write_bytes(b"".join(broken))
        invalid_lines, valid_token_lines = [], []
        for i, line in enumerate(target.read_bytes().splitlines()):
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                invalid_lines.append(i + 1)
                continue
            if event.get("type") == "event_msg" and event.get("payload", {}).get("type") == "token_count":
                valid_token_lines.append(i + 1)
        assert len(invalid_lines) == (0 if mode == "normal" else 1)
        assert len(valid_token_lines) == (len(token_indices) if mode == "normal" else 0 if removed else len(token_indices) - 1)
        save(case / "mutation.json", {"case": mode, "target": str(relative),
             "removedOriginalTokenLines": [i + 1 for i in removed],
             "corruptedOriginalLine": None if mode == "normal" else token_indices[-1] + 1,
             "invalidLinesInCopy": invalid_lines, "validTokenLinesInCopy": valid_token_lines,
             "construction": "Unique-token control removes earlier token events only from the copy; all non-token lines retained."})
        before = hashes(job)
        command = [sys.executable, str(Path(__file__).resolve()), "--render", str(job), str(target)]
        with (case / "report-command.log").open("x") as log:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        observed = json.loads((case / "render-observation.json").read_text())
        assert observed["reportCompleted"] and result.returncode == 0
        assert observed["reportCounts"] == observed["independentNativeCounts"] == {"passed": 2}
        assert observed["reportClassificationExit"] == observed["independentClassificationExit"] == 0
        assert observed["nativeRewards"] == {d.name: r.get("verifier_result") for d, r in rows}
        summary = (job / "summary.md").read_text()
        reported = {}
        for directory, native in rows:
            matches = [line for line in summary.splitlines() if line.startswith(f"| {native['task_name']} |")]
            assert len(matches) == 1
            fields = [s.strip() for s in matches[0].split("|")[1:-1]]
            assert fields[1] == "passed"
            reported[directory.name] = fields[2:5]
        assert reported[peer.name] == [str(usages[peer.name]["total"][k]) for k in FIELDS]
        if mode == "normal":
            assert reported[target_trial.name] == [str(target_usage["total"][k]) for k in FIELDS]
            assert "Executor usage unavailable" not in summary
        else:
            assert "Executor usage unavailable: JSONDecodeError" in summary
            assert evaluate.diagnostic_text(f"{target}:{invalid_lines[0]}") in summary
        unknown = reported[target_trial.name] == ["unknown"] * 3
        fallback = mode != "normal" and reported[target_trial.name] == [str(earlier[k]) for k in FIELDS]
        after = hashes(job)
        assert {k: v for k, v in after.items() if k != "summary.md"} == {k: v for k, v in before.items() if k != "summary.md"}
        assert all(after.get(k) == h for k, h in original.items() if k not in (str(relative), "summary.md"))
        assert hashes(case / "job.inputs") == original_inputs
        observation = {"case": mode, **observed, "reportCommandExit": result.returncode,
            "reportedUsage": reported, "affectedUsageDisplayedUnknown": unknown,
            "fellBackToEarlierCumulativeUsage": fallback,
            "usageUnavailableDiagnostic": "Executor usage unavailable" in summary,
            "unmetExpectations": ["corrupt token evidence is displayed as numeric usage"] if mode != "normal" and not unknown else [],
            "peerPreserved": True, "nativeScoresAndFrozenInputsPreserved": True}
        save(case / "observation.json", observation)
        observations.append(observation)
        print(mode, "report exit", result.returncode, "unknown", unknown, "earlier fallback", fallback, flush=True)
    assert hashes(source) == original and hashes(inputs) == original_inputs
    save(output / "observations.json", observations)
    failed = [o["case"] for o in observations if o["unmetExpectations"]]
    save(output / "summary.json", {"cases": 3, "unmetCases": failed, "originalJobAndFrozenInputsPreserved": True,
         "scope": "JSON corruption controls only; no execution or regrade"})
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "--render":
        # Reuse the guarded public report CLI, without a read-refusal injection.
        raise SystemExit(render(Path(sys.argv[2]), Path(sys.argv[3]), "normal"))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New evidence directory only")
    args = parser.parse_args()
    raise SystemExit(run(args.source, args.output))
