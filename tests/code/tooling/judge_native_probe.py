"""Opt-in Docker controls through native Harbor; no executor or judge API calls."""
import argparse
from contextlib import redirect_stdout
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import traceback

ROOT = Path(__file__).resolve().parents[3]
HOME = ROOT / "tests/skills"
CASES = (("valid-low", 1, 0.5, "calibration-fail", 1),
         ("format-then-success", 2, 1.0, "calibration-pass", 0),
         ("format-exhausted", 3, None, "unscored", 1),
         ("timeout", 1, None, "unscored", 1))


def save(path, value):
    with path.open("x") as stream:
        json.dump(value, stream, indent=2)


def hashes(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*"))
            if p.is_file() and "__pycache__" not in p.parts}


def run(output):
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    sys.path.insert(0, str(ROOT))
    spec = importlib.util.spec_from_file_location("evaluate", HOME / "evaluate.py")
    evaluate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(evaluate)
    evaluate.check_image_inputs()
    image = evaluate.image_identity()
    pinned_tag = "rsp-eval-agent:offline-" + image.split()[0].split(":")[1][:16]
    subprocess.run(["docker", "tag", image.split()[0], pinned_tag], check=True)
    assert subprocess.check_output(["docker", "image", "inspect", pinned_tag,
                                   "--format", "{{.Id}}"], text=True).strip() == image.split()[0]
    source = HOME / "tasks/release-evidence"
    source_before = hashes(source)
    save(output / "source-before.json", {"head": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "image": image, "pinnedLocalTag": pinned_tag, "task": source_before,
        "support": hashes(HOME / "support"), "probe": hashes(ROOT / "tests/code/fixtures/judge-native")})
    # Do not load evaluation credentials. Both native phases have no network.
    env = {key: os.environ[key] for key in ("PATH", "HOME", "TMPDIR", "DOCKER_HOST",
           "DOCKER_CONTEXT", "DOCKER_CONFIG") if key in os.environ}
    env.update(PYTHONPATH=str(ROOT), HARBOR_TELEMETRY="0",
               LITELLM_LOCAL_MODEL_COST_MAP="True")
    results = []
    for name, calls, score, outcome, expected_exit in CASES:
        inputs = output / (name + ".inputs")
        task = inputs / "tasks" / ("release-evidence--" + name)
        shutil.copytree(source, task, ignore=shutil.ignore_patterns("__pycache__"))
        hook = task / "tests/.offline/sitecustomize.py"
        hook.parent.mkdir()
        shutil.copy2(ROOT / "tests/code/fixtures/judge-native/sitecustomize.py", hook)
        # Observe the original shell's exit without changing its body or status.
        test_script = task / "tests/test.sh"
        shutil.copy2(test_script, hook.parent / "original-test.sh")
        test_script.write_text(
            '#!/usr/bin/env bash\nset +e\nbash /tests/.offline/original-test.sh\n'
            'status=$?\nprintf \'{"exitCode":%s}\\n\' "$status" > /logs/verifier/process-status.json\n'
            'exit "$status"\n')
        config_text = (task / "task.toml").read_text()
        start = config_text.index("[verifier.env]")
        end = config_text.index("[environment]", start)
        config_text = config_text[:start] + (
            '[verifier.env]\nRSP_JUDGE_HOST = ""\nRSP_EVAL_OFFLINE = "0"\n'
            'OPENAI_API_BASE = "http://127.0.0.1:1"\nOPENAI_API_KEY = "offline-test"\n'
            'RSP_JUDGE_API_KEY = "offline-test"\nLITELLM_LOCAL_MODEL_COST_MAP = "True"\n'
            'PYTHONPATH = "/tests/.offline"\nRSP_OFFLINE_JUDGE_CASE = ' + json.dumps(name) + '\n\n'
        ) + config_text[end:]
        config_text = config_text.replace("[environment]\n", '[environment]\nnetwork_mode = "no-network"\n')
        (task / "task.toml").write_text(config_text)
        # Separate verifier environments build from tests/Dockerfile, so pin
        # both roles to the same inspected local base image.
        for relative in ("environment/Dockerfile", "tests/Dockerfile"):
            dockerfile = task / relative
            dockerfile.write_text(dockerfile.read_text().replace(
                "rsp-eval-agent:2026-10-08", pinned_tag))
        config = {"job_name": name, "jobs_dir": str(output), "quiet": True,
                  "n_attempts": 1, "n_concurrent_trials": 1,
                  "retry": {"max_retries": 0}, "agents": [{"name": "oracle"}],
                  "environment": {"type": "docker", "delete": True},
                  "tasks": [{"path": str(task)}]}
        evaluate.JobConfig.model_validate(config)
        save(inputs / "job.json", config)
        frozen = hashes(inputs)
        save(output / (name + "-input-hashes.json"), frozen)
        command = [str(Path(sys.executable).with_name("harbor")), "run", "-y", "-c", str(inputs / "job.json")]
        started = time.monotonic()
        with (output / (name + "-native.log")).open("x") as log:
            process = subprocess.run(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
        receipt = {"scenario": name, "command": command, "nativeExit": process.returncode,
                   "seconds": time.monotonic() - started}
        save(output / (name + "-native.json"), receipt)
        job = output / name
        try:
            before_report = hashes(job)
            captured = io.StringIO()
            with redirect_stdout(captured):
                counts = evaluate.report(job)
            (output / (name + "-report.log")).write_text(captured.getvalue())
            classification_exit = evaluate.exit_status(job, counts)
            receipt.update(counts=dict(counts), classificationExit=classification_exit,
                           combinedExit=process.returncode or classification_exit)
            trials = list(evaluate.native_results(job))
            assert len(trials) == 1, "Expected exactly one native trial"
            directory, result = trials[0]
            logs = directory / "verifier"
            observation = json.loads((logs / "sdk-observation.json").read_text())
            assert observation["sdkCalls"] == calls
            # Harbor enforces no-network using its egress-control namespace;
            # interface presence does not establish or refute outbound access.
            assert observation["blockedConnections"] == []
            assert observation["gradeEntry"] == "/opt/rsp-eval/grade.py"
            verifier_exit = json.loads((logs / "process-status.json").read_text())["exitCode"]
            receipt["verifierExit"] = verifier_exit
            assert verifier_exit == (1 if score is None else 0)
            for module, digest in observation["bakedModuleHashes"].items():
                assert digest == hashlib.sha256((HOME / "support" / (module + ".py")).read_bytes()).hexdigest()
            assert dict(counts) == {outcome: 1}
            assert process.returncode == 0, "Native Harbor CLI did not complete successfully"
            assert classification_exit == expected_exit
            assert receipt["combinedExit"] == expected_exit
            assert (logs / "reward.json").exists() == (score is not None)
            detail = json.loads((logs / "reward-details.json").read_text())
            status = json.loads((logs / "evaluation-status.json").read_text())
            assert (logs / "check.log").is_file()
            summary = (job / "summary.md").read_text()
            assert f"| {result['task_name']} | {outcome} |" in summary
            assert f"{directory.name}/verifier/reward-details.json" in summary
            if score is None:
                assert result["exception_info"]["exception_type"] == "RewardFileNotFoundError"
                assert not (result.get("verifier_result") or {}).get("rewards")
                assert status["errors"]
                assert "RewardFileNotFoundError" in summary
                stdout = (logs / "test-stdout.txt").read_text()
                if name == "format-exhausted":
                    assert status["errors"] == ["unhandled errors in a TaskGroup (1 sub-exception)"]
                    assert detail["root_causes"] == status["root_causes"]
                    cause = detail["root_causes"][0]
                    assert cause["type"] == "builtins.ValueError"
                    assert cause["message"].endswith("invalid-format-3")
                    assert cause["location"]["function"] == "parse_judge_response"
                    assert "invalid-format-3" in stdout and "direct cause" in stdout
                    assert [a["content"] for a in observation["attempts"]] == [
                        "invalid-format-1", "invalid-format-2", "invalid-format-3"]
                else:
                    assert status["errors"] == ["judge timed out after 300s"]
                    assert json.loads((logs / "unscored-reward.json").read_text()) == {"reward": 0.5}
                    assert "Verifier evidence unavailable" in stdout
            else:
                assert result.get("exception_info") is None
                assert result["verifier_result"]["rewards"] == {"reward": score}
                assert status["errors"] == []
                components = {name: node["score"] for name, node in evaluate.reward_nodes(detail)
                              if name in ("checks", "judge")}
                assert components == {"checks": 1.0, "judge": 0.0 if score < 1 else 1.0}
                if name == "format-then-success":
                    assert observation["attempts"][0]["content"] == "invalid-format-1"
            after_report = hashes(job)
            assert all(after_report.get(path) == value for path, value in before_report.items())
            assert hashes(inputs) == frozen
            receipt["verified"] = True
        except Exception:
            receipt.update(verified=False, error=traceback.format_exc())
        save(output / (name + "-assessment.json"), receipt)
        results.append(receipt)
        print(name, "verified" if receipt["verified"] else "FAILED; retained evidence", flush=True)
    assert hashes(source) == source_before
    assert evaluate.image_identity() == image
    save(output / "summary.json", {"controls": results, "sourcePreserved": True,
         "image": image, "realExecutorOrJudgeCalls": 0, "scope": "Native oracle controls, not Skill acceptance"})
    return 0 if all(r["verified"] for r in results) else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="New evidence directory; never reuse a historical job")
    raise SystemExit(run(parser.parse_args().output))
