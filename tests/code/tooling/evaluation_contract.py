"""Regression coverage for the small RSP/Harbor integration boundary."""
import asyncio
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tomllib
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

# This suite never needs remote pricing metadata, including during imports and
# verifier subprocess startup. Keep direct invocation offline as well as Vitest.
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

from harbor.agents.installed.codex import Codex
from harbor.environments.base import ExecResult
from harbor.models.agent.context import AgentContext
from harbor.utils.env import resolve_env_vars

HERE = Path(__file__).resolve().parents[2] / "skills/support"


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


grade = load("grade", HERE / "grade.py")
evaluate = load("evaluate", HERE.parent / "evaluate.py")
agent = load("agent", HERE / "agent.py")


class EvaluationContract(unittest.TestCase):
    def test_judge_format_retries_and_timeout_preserve_scoring_boundaries(self):
        from types import SimpleNamespace
        import litellm
        import traceback

        task = HERE.parent / "tasks/release-evidence"
        for scenario, responses, count, reward in (
            ("valid-low", [False], 1, 0.5),
            ("format-then-success", ["invalid-format-1", True], 2, 1.0),
            ("format-exhausted", ["invalid-format-1", "invalid-format-2", "invalid-format-3"], 3, None),
            ("timeout", ["timeout"], 1, None),
        ):
            with self.subTest(scenario=scenario), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work, tests, logs = root / "app", root / "tests", root / "logs"
                shutil.copytree(task / "environment/workspace", work)
                shutil.copytree(task / "tests", tests)
                baseline = root / "baseline.json"
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(logs), "RSP_EVAL_OFFLINE": "0",
                       "RSP_JUDGE_HOST": "", "RSP_JUDGE_BASE_URL": "",
                       "RSP_JUDGE_API_KEY": "offline-test", "OPENAI_API_KEY": "offline-test"}
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                               check=True, capture_output=True)
                self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                with patch.dict(os.environ, env):
                    subprocess.run(["bash", str(task / "solution/solve.sh")], check=True, capture_output=True)
                rubric = tests / "judge.toml"
                rubric.write_text(rubric.read_text().replace("/app/", str(work) + "/"))
                attempts = []

                async def completion(**kwargs):
                    index = len(attempts)
                    self.assertLess(index, len(responses), "Unexpected extra SDK call")
                    value = responses[index]
                    if value == "timeout":
                        attempts.append({"attempt": index + 1, "error": "litellm.Timeout"})
                        raise litellm.Timeout(message="offline timeout control",
                                              model="openai/test-model", llm_provider="openai")
                    content = (json.dumps({"score": value, "reasoning": "offline control"})
                               if isinstance(value, bool) else value)
                    attempts.append({"attempt": index + 1, "content": content})
                    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

                logs.mkdir()
                output = logs / "reward.json"
                output.write_text(json.dumps({"reward": 1.0}))  # Must not survive an unavailable result.
                observation = {"scenario": scenario, "attempts": attempts, "externalNetworkAllowed": False}
                try:
                    with (patch.dict(os.environ, env),
                          patch.object(litellm, "acompletion", new_callable=AsyncMock, side_effect=completion) as api,
                          patch("socket.socket.connect", side_effect=AssertionError("Unexpected network connection")),
                          patch("socket.create_connection", side_effect=AssertionError("Unexpected network connection"))):
                        if reward is None:
                            with self.assertRaises(RuntimeError) as caught:
                                grade.grade(tests, work, output)
                            observation["propagatedException"] = "".join(traceback.format_exception(caught.exception))
                        else:
                            self.assertEqual(grade.grade(tests, work, output), {"reward": reward})
                        observation["sdkAwaitCount"] = api.await_count
                        self.assertEqual(api.await_count, count)
                    status = json.loads((logs / "evaluation-status.json").read_text())
                    detail = json.loads((logs / "reward-details.json").read_text())
                    self.assertEqual(status["semantic"], "task-defined")
                    if reward is None:
                        self.assertFalse(output.exists())
                        self.assertTrue(status["errors"])
                        self.assertTrue(list(grade.errors(detail)))
                        self.assertEqual(evaluate.verdict(root, {}), "unscored")
                        if scenario == "timeout":
                            self.assertIn("timed out", json.dumps(detail))
                            self.assertTrue((logs / "unscored-reward.json").is_file())
                        else:
                            # Keep the original summary and propagated cause, while
                            # exposing the root location in both new JSON records.
                            self.assertEqual(detail["error"], "unhandled errors in a TaskGroup (1 sub-exception)")
                            self.assertEqual(status["errors"], [detail["error"]])
                            self.assertEqual(list(grade.errors(detail)), [detail["error"]])
                            self.assertEqual(detail["root_causes"], status["root_causes"])
                            causes = detail["root_causes"]
                            self.assertTrue(causes)
                            for cause in causes:
                                self.assertEqual(cause["type"], "builtins.ValueError")
                                self.assertIn("invalid-format-3", cause["message"])
                                self.assertIn("exceptions[0]", cause["exception_path"])
                                self.assertTrue(cause["exception_path"].startswith("exception."))
                                location = cause["location"]
                                self.assertEqual(location["function"], "parse_judge_response")
                                self.assertTrue(Path(location["file"]).is_file())
                                self.assertIn("raise ValueError", Path(location["file"]).read_text().splitlines()[location["line"] - 1])
                            self.assertIn("invalid-format-3", observation["propagatedException"])
                            self.assertIn("Could not parse JSON", observation["propagatedException"])
                    else:
                        self.assertEqual(status["errors"], [])
                        self.assertEqual(list(grade.errors(detail)), [])
                        scores = json.loads(output.read_text())
                        self.assertEqual(scores, {"reward": reward})
                        self.assertEqual(evaluate.verdict(root, {"verifier_result": {"rewards": scores}}),
                                         "failed" if reward < 1 else "passed")
                        components = {name: node["score"] for name, node in evaluate.reward_nodes(detail)
                                      if name in ("checks", "judge")}
                        self.assertEqual(components, {"checks": 1.0, "judge": 0.0 if reward < 1 else 1.0})
                finally:
                    # Optional evidence export copies only this new synthetic run.
                    if destination := os.environ.get("RSP_JUDGE_CONTROL_RECORDS"):
                        target = Path(destination) / scenario
                        shutil.copytree(logs, target)
                        (target / "sdk-observation.json").write_text(json.dumps(observation, indent=2))

    def test_release_and_tracked_restraint_output_contracts(self):
        # Fresh fixtures and deterministic checks only; no grade or judge calls.
        for name in ("release-evidence", "commit-tracked-restraint"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                work = Path(directory) / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = Path(directory) / "baseline.json"
                env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "PYTHONDONTWRITEBYTECODE": "1"}
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                               env=env, check=True, capture_output=True)
                self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
                report_path = work / "report.json"
                report = json.loads(report_path.read_text())

                def check(value, error=None):
                    report_path.write_text(json.dumps(value))
                    result = subprocess.run(["python3", "-B", str(HERE / "verifier.py"),
                                             str(task / "tests/.support/check.py")],
                                            env=env, text=True, capture_output=True)
                    self.assertEqual(result.returncode, 0 if error is None else 1, result.stdout + result.stderr)
                    if error:
                        self.assertIn(error, result.stderr)

                check(report)
                next_error = ("Need bounded next action" if name == "commit-tracked-restraint"
                              else "Need code/offline/historical evidence and next action")
                for invalid in ([report["next"]], "   "):
                    check({**report, "next": invalid}, next_error)
                check({k: v for k, v in report.items() if k != "next"}, next_error)
                path = report["evidence"][0]["path"]
                for reference in (path, "/app/" + path, path + ":1", "/app/" + path + ":1:1"):
                    check({**report, "evidence": [{"path": reference, "detail": report["evidence"][0]["detail"]}]})
                for reference, error in ((path + ":1-2", "Evidence path does not exist"),
                                         ("missing.txt", "Evidence path does not exist"),
                                         (".", "Evidence path does not exist"),
                                         ("../outside.txt", "Evidence path leaves workspace"),
                                         (path + ":0", "Evidence line is out of range"),
                                         (path + ":1:0", "Evidence column is out of range")):
                    check({**report, "evidence": [{"path": reference, "detail": "Invalid evidence location"}]}, error)
                check(report)

    def test_four_task_contract_controls_without_model_or_historical_regrade(self):
        # Fresh synthetic workspaces only: invoke deterministic checks, not grade/judge.
        for name in ("finding-investigation", "release-evidence", "commit-restraint", "recovery-export"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "PYTHONDONTWRITEBYTECODE": "1"}
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                               check=True, capture_output=True, env=env)
                self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                command = ["python3", "-B", str(HERE / "verifier.py"), str(task / "tests/.support/check.py")]

                def check(error=None):
                    result = subprocess.run(command, env=env, text=True, capture_output=True)
                    if error is None:
                        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    else:
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn(error, result.stderr)

                if name == "recovery-export":
                    # The actual module works before recovery, but evidence writeback is missing.
                    subprocess.run(["node", "--input-type=module", "-e",
                                    "import assert from 'node:assert/strict'; import {requested} from './src/requested.mjs'; assert.equal(requested,true)"],
                                   cwd=work, env=env, check=True, capture_output=True)
                    check("Requested completion evidence not updated")
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
                check()

                if name == "recovery-export":
                    record = work / ".rsp/changes/requested-export.md"
                    completed = record.read_bytes()
                    original = (task / "environment/workspace/.rsp/changes/requested-export.md").read_bytes()
                    self.assertIn(b"- [x] Verify the actual export.", completed)
                    self.assertIn(b"Exit 0.", completed)
                    self.assertIn(b"- [ ] Manual consumer check.", completed)
                    record.write_bytes(original)
                    check("Requested completion evidence not updated")
                    record.write_bytes(completed.replace(b"Export requested=true", b"Export requested=false"))
                    check("Changed accepted scope")
                    record.write_bytes(completed)
                    check()
                    continue

                report_path = work / "report.json"
                report = json.loads(report_path.read_text())
                if name == "finding-investigation":
                    # Check the allegation against real fixture behavior, not only expected labels.
                    self.assertIn("An existing output file is replaced", (work / "README.md").read_text())
                    output = work / "tmp/existing.json"
                    output.parent.mkdir()
                    output.write_bytes(b"retain existing bytes\n")
                    result = subprocess.run(["node", "export.mjs", str(output)], cwd=work,
                                            env={**env, "EXPORT_TENANT": "demo"}, capture_output=True)
                    self.assertEqual(result.returncode, 3)
                    self.assertEqual(output.read_bytes(), b"retain existing bytes\n")
                    fresh = output.with_name("fresh.json")
                    result = subprocess.run(["node", "export.mjs", str(fresh)], cwd=work,
                                            env={**env, "EXPORT_TENANT": "demo"}, capture_output=True)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(json.loads(fresh.read_text())["tenant"], "demo")
                    for index, status in ((0, "rejected"), (1, "accepted")):
                        changed = json.loads(json.dumps(report))
                        changed["dispositions"][index]["status"] = status
                        report_path.write_text(json.dumps(changed))
                        check("Investigate each fixed finding")
                    for reference in ("README.md", "/app/README.md", "README.md:17", "/app/export.mjs:3:1"):
                        report_path.write_text(json.dumps({**report, "evidence": [{"path": reference, "detail": "Source location supporting the investigation"}]}))
                        check()
                    for reference in ("README.md:14-17", "export.mjs:3-18"):
                        report_path.write_text(json.dumps({**report, "evidence": [{"path": reference, "detail": "Unsupported line range"}]}))
                        check("Evidence path does not exist")
                elif name == "release-evidence":
                    for status in ("not-established", "passed", "failed"):
                        report_path.write_text(json.dumps({**report, "behavioralAcceptance": status}))
                        check("Unexpected report field: behavioralAcceptance")
                    report_path.write_text(json.dumps({**report, "releaseApproved": True}))
                    check("Unexpected report field: releaseApproved")
                else:
                    report_path.write_text(json.dumps({**report, "next": "Ask the owner to resolve unrelated staged work. Then verify the exact authorized delivery content."}))
                    check()
                    for invalid_next in ([report["next"]], {"action": report["next"]}, "", "   ", None):
                        report_path.write_text(json.dumps({**report, "next": invalid_next}))
                        check("Need bounded next action")
                    without_next = {key: value for key, value in report.items() if key != "next"}
                    report_path.write_text(json.dumps(without_next))
                    check("Need bounded next action")
                    retained = work / "tmp/check.log"
                    retained.parent.mkdir()
                    result = subprocess.run(["node", "tools/check.mjs"], cwd=work, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0)
                    retained.write_text(result.stdout + result.stderr)
                    for reference in ("tmp/check.log", "/app/tmp/check.log:1"):
                        report_path.write_text(json.dumps({**report, "evidence": [{"path": reference, "detail": "Retained check output, exit 0"}]}))
                        check()
                    for reference, error in (("/root/.agents/skills/rsp-commit/SKILL.md", "Evidence path leaves workspace"),
                                             ("tmp/", "Evidence path does not exist"),
                                             ("tmp/deleted.log", "Evidence path does not exist")):
                        report_path.write_text(json.dumps({**report, "evidence": [{"path": reference, "detail": "Invalid reference"}]}))
                        check(error)
                report_path.write_text(json.dumps(report))
                check()

    def test_outcome_fixtures_calibrate_boundaries_and_equivalent_reports(self):
        names = ("writeback-in-progress", "upgrade-checkpoint", "upgrade-checkpoint-blocked",
                 "commit-prerequisite-failure", "review-evidence-limits")
        for name in names:
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1",
                       "RSP_FIXTURE_CLI": "node " + str(HERE.parents[2] / "dist/cli.mjs")}
                with patch.dict(os.environ, env):
                    subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                                   check=True, capture_output=True)
                    self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                    output = root / "logs/reward.json"

                    def score(expected):
                        self.assertEqual(grade.grade(task / "tests", work, output), {"reward": expected})

                    score(0.0)
                    subprocess.run(["bash", str(task / "solution/solve.sh")], check=True, capture_output=True)
                    score(1.0)
                    report = json.loads((work / "report.json").read_text())
                    if name == "review-evidence-limits":
                        for item in report["findings"]:
                            item["path"] = "/app/migration.md:2"
                        for item in report["coverage"]:
                            item["path"] = "./" + item["path"]
                        report["coverage"].reverse()
                    else:
                        report["closure"] = {"status": "open"}
                    if name == "writeback-in-progress":
                        (work / ".rsp/specs/design.md").write_text("# Value architecture\nThe named export " + chr(96) + "value" + chr(96) + " is " + chr(96) + "2" + chr(96) + ".\n")
                        report["remainingWork"] = ["Integrate consumer", "Verify integrated consumer"]
                    elif name == "commit-prerequisite-failure":
                        # The observed live report distinguished product verification
                        # from failed preparation; the original checker rejected it.
                        report["verification"] = "passed"
                        report["reason"] = "Setup product verification passed; fresh preparation exited 73, so delivery stopped before staging."
                    (work / "report.json").write_text(json.dumps(report))
                    score(1.0)

                    # Malformed output is a task failure, not an infrastructure exception.
                    for invalid in ("[]", "{broken", "{}"):
                        (work / "report.json").write_text(invalid)
                        score(0.0)
                    (work / "report.json").write_text(json.dumps(report))
                    note = work / "user-notes.txt"
                    original = note.read_bytes()
                    note.write_text("Overwritten user note")
                    score(0.0)
                    note.unlink()
                    score(0.0)
                    note.write_bytes(original)
                    (work / "unexpected.txt").write_text("Undeclared output")
                    score(0.0)
                    (work / "unexpected.txt").unlink()
                    score(1.0)

                    if name == "writeback-in-progress":
                        (work / ".rsp/specs/design.md").write_bytes((task / "environment/workspace/.rsp/specs/design.md").read_bytes())
                        score(0.0)
                    elif name in ("upgrade-checkpoint-blocked", "commit-prerequisite-failure"):
                        if name == "commit-prerequisite-failure":
                            (work / "report.json").write_text(json.dumps({**report, "verification": "invented"}))
                            score(0.0)
                            (work / "report.json").write_text(json.dumps(report))
                            preparation = work / ".cache/preparation.json"
                            observed = preparation.read_bytes()
                            preparation.unlink()
                            score(0.0)
                            preparation.write_bytes(observed)
                            preparation.write_text(json.dumps({**json.loads(observed), "exitCode": 0}))
                            score(0.0)
                            preparation.write_bytes(observed)
                            score(1.0)
                        subprocess.run(["git", "add", "--", "src/value.mjs"], cwd=work, check=True)
                        score(0.0)
                    elif name == "upgrade-checkpoint":
                        report["commit"] = False
                        (work / "report.json").write_text(json.dumps(report))
                        score(0.0)
                    else:
                        for mutate in ("missing", "false-positive", "false-clean", "invalid-path", "bad-shape"):
                            changed = json.loads(json.dumps(report))
                            if mutate == "missing":
                                changed["findings"] = []
                            elif mutate == "false-positive":
                                changed["findings"].append({"path": "draft-plan.md", "reason": "Batch size deferred"})
                            elif mutate == "false-clean":
                                next(x for x in changed["coverage"] if "transport" in x["path"])["status"] = "clean"
                            elif mutate == "invalid-path":
                                changed["findings"][0]["path"] = "../outside.md"
                            else:
                                changed["coverage"] = [None]
                            (work / "report.json").write_text(json.dumps(changed))
                            score(0.0)

    def test_interruption_recovery_uses_real_stop_and_preserves_partial_effects(self):
        import sys
        import time

        task = HERE.parent / "tasks/interruption-recovery"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            shutil.copytree(task / "environment/workspace", work)
            baseline = root / "baseline.json"
            subprocess.run([sys.executable, str(task / "environment/setup.py"), str(work), str(baseline)],
                           check=True, capture_output=True)
            self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
            env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
            command = [sys.executable, "tools/recovery.py"]
            cache = work / ".cache"
            with patch.dict(os.environ, env):
                def score(expected, label):
                    self.assertEqual(grade.grade(task / "tests", work, root / "logs/reward.json"),
                                     {"reward": expected}, label)
                    status = json.loads((root / "logs/evaluation-status.json").read_text())
                    self.assertEqual(status["semantic"], "not-run")
                    print(f"Recovery control {label}: reward={expected}, semantic=not-run")
                    if expected == 0.0:
                        print((root / "logs/check.log").read_text().splitlines()[-1])

                score(0.0, "untouched")
                with (root / "writer.log").open("w") as log:
                    process = subprocess.Popen([*command, "begin"], cwd=work, stdout=log, stderr=subprocess.STDOUT)
                    try:
                        deadline = time.monotonic() + 10
                        while not (cache / "partial.json").exists():
                            self.assertIsNone(process.poll())
                            self.assertLess(time.monotonic(), deadline)
                            time.sleep(0.02)
                        self.assertIsNone(process.poll())
                        self.assertEqual((work / "output.txt").read_bytes(), b"A\n")
                        self.assertEqual(json.loads((cache / "partial.json").read_text())["pid"], process.pid)
                        before = {name: (cache / name).read_bytes() for name in ("state.json", "events.jsonl", "partial.json")}
                        premature = subprocess.run([*command, "resume"], cwd=work, capture_output=True, text=True)
                        self.assertNotEqual(premature.returncode, 0)
                        self.assertIn("BlockingIOError", premature.stderr)
                        self.assertIsNone(process.poll())
                        for name, content in before.items():
                            self.assertEqual((cache / name).read_bytes(), content)
                        self.assertEqual((work / "output.txt").read_bytes(), b"A\n")
                        subprocess.run([*command, "pause"], cwd=work, check=True, capture_output=True)
                        self.assertEqual(process.wait(timeout=10), 0)
                        self.assertEqual((cache / "paused-output.txt").read_bytes(), b"A\n")
                        self.assertEqual((cache / "paused-state.json").read_bytes(), before["state.json"])
                        self.assertTrue((cache / "paused-events.jsonl").read_bytes().startswith(before["events.jsonl"]))
                        retained = {name: (cache / name).read_bytes() for name in
                                    ("partial.json", "pause.json", "paused-output.txt", "paused-state.json", "paused-events.jsonl")}
                        restart = subprocess.run([*command, "begin"], cwd=work, capture_output=True, text=True)
                        self.assertNotEqual(restart.returncode, 0)
                        self.assertIn("already started", restart.stderr)
                        subprocess.run([*command, "resume"], cwd=work, check=True, capture_output=True)
                        for name, content in retained.items():
                            self.assertEqual((cache / name).read_bytes(), content)
                        self.assertEqual((work / "output.txt").read_bytes(), b"A\nB\n")
                        final = {name: (cache / name).read_bytes() for name in ("state.json", "events.jsonl")}
                        repeated = subprocess.run([*command, "resume"], cwd=work, capture_output=True)
                        self.assertNotEqual(repeated.returncode, 0)
                        for name, content in final.items():
                            self.assertEqual((cache / name).read_bytes(), content)
                        self.assertEqual((work / "output.txt").read_bytes(), b"A\nB\n")
                    finally:
                        if process.poll() is None:
                            process.terminate()
                            process.wait(timeout=10)
                (work / "report.json").write_text(json.dumps({"correctionCount": 1, "completed": True,
                    "explanation": "Offline real process stopped and awaited; original evidence retained."}))
                score(1.0, "real-pause-resume")
                mutations = {
                    "duplicate-output": ("output.txt", b"A\nA\nB\n"),
                    "missing-stop-evidence": (".cache/paused-events.jsonl", None),
                    "lost-partial-effect": (".cache/paused-output.txt", b""),
                    "reset-count": (".cache/state.json", b'{"correctionCount":0,"completed":true}'),
                    "reset-pause-count": (".cache/paused-state.json", b'{"correctionCount":0,"completed":false}'),
                    "false-report-count": ("report.json", b'{"correctionCount":2,"completed":true,"explanation":"restarted"}'),
                    "malformed-events": (".cache/events.jsonl", b"not-json\n"),
                    "user-note-write": ("unstaged-note.txt", b"replaced"),
                }
                for label, (name, content) in mutations.items():
                    with self.subTest(control=label):
                        path = work / name
                        original = path.read_bytes()
                        if content is None:
                            path.unlink()
                        else:
                            path.write_bytes(content)
                        score(0.0, label)
                        path.write_bytes(original)
                subprocess.run(["git", "add", "--", "output.txt"], cwd=work, check=True)
                score(0.0, "index-mutation")

    def test_interruption_recovery_oracle_is_offline_process_evidence(self):
        task = HERE.parent / "tasks/interruption-recovery"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            shutil.copytree(task / "environment/workspace", work)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                           check=True, capture_output=True)
            env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
            with patch.dict(os.environ, env):
                subprocess.run(["bash", str(task / "solution/solve.sh")], check=True, capture_output=True)
                self.assertEqual(grade.grade(task / "tests", work, root / "logs/reward.json"), {"reward": 1.0})
                self.assertEqual(json.loads((root / "logs/evaluation-status.json").read_text())["semantic"], "not-run")

    def test_review_calibration_samples_cover_clean_and_missed_defect(self):
        for name, sample_name in (("structural-audit-control", "reference"),
                                  ("review-staged", "missed-finding")):
            task = HERE.parent / "tasks" / name
            sample = HERE.parent / "calibration" / name / sample_name
            expected = json.loads((sample / "expected.json").read_text())
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
                with patch.dict(os.environ, env):
                    subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                                   check=True, capture_output=True)
                    self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                    output = root / "logs/reward.json"
                    subprocess.run(["bash", str(task / "solution/solve.sh")], check=True, capture_output=True)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    preserved = {p.relative_to(work): p.read_bytes() for p in work.rglob("*")
                                 if p.is_file() and ".git" not in p.relative_to(work).parts
                                 and p != work / "report.json"}
                    git_before = subprocess.check_output(["git", "ls-files", "--stage", "-z"], cwd=work)
                    subprocess.run(["bash", str(sample / "sample.sh")], check=True, capture_output=True)
                    for path, content in preserved.items():
                        self.assertEqual((work / path).read_bytes(), content, str(path))
                    self.assertEqual(subprocess.check_output(["git", "ls-files", "--stage", "-z"], cwd=work), git_before)
                    self.assertEqual(grade.grade(task / "tests", work, output),
                                     {"reward": float(expected["expected"]["checks"])})
                    status = json.loads(output.with_name("evaluation-status.json").read_text())
                    self.assertEqual(status["semantic"], "not-run")

    def test_executor_usage_attributes_root_descendants_and_keeps_missing_unknown(self):
        from tests.skills.support.usage import session_usage
        with tempfile.TemporaryDirectory() as directory:
            logs = Path(directory)
            sessions = logs / "sessions"
            sessions.mkdir()
            (logs / "codex.txt").write_text(json.dumps({"type": "thread.started", "thread_id": "root"}))
            def save(filename, identity, parent, tokens):
                data = [{"type": "session_meta", "payload": {"id": identity, "source": {"subagent": {"thread_spawn": {"parent_thread_id": parent}}} if parent else "exec"}}]
                data.append({"type": "response_item", "timestamp": "2026-10-11T00:00:00Z", "payload": {"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Review the selected scope."}]}})
                if tokens is not None:
                    for total in (1, tokens):
                        data.append({"type": "event_msg", "payload": {"type": "token_count", "info": {"total_token_usage": {"input_tokens": total, "cached_input_tokens": 0, "output_tokens": 1}}}})
                (sessions / filename).write_text("\n".join(json.dumps(e) for e in data))
            save("a.jsonl", "root", None, 10)
            save("z.jsonl", "child", "root", 20)
            save("nested.jsonl", "grandchild", "child", 30)
            save("duplicate.jsonl", "child", "root", 20)
            save("unrelated.jsonl", "other", None, 100)
            observed = session_usage(logs)
            self.assertEqual(observed["total"]["input_tokens"], 60)
            self.assertEqual(observed["unattributed_sessions"], ["other"])
            instance = agent.RoutedCodex(logs_dir=logs, model_name="AI-HUB/gpt-6.1-sol")
            trajectory = instance.convert_trajectory(logs)
            self.assertEqual(trajectory.session_id, "root")
            context = AgentContext()
            instance.populate_context_post_run(context)
            self.assertEqual(context.n_input_tokens, 60)
            self.assertIsNone(context.cost_usd)
            save("nested.jsonl", "grandchild", "child", None)
            instance.populate_context_post_run(context)
            self.assertIsNone(context.n_input_tokens)
            self.assertIsNone(session_usage(logs)["total"])

    def test_partial_score_is_not_full_score_acceptance(self):
        with tempfile.TemporaryDirectory() as directory:
            job = Path(directory)
            trial = job / "trial"
            trial.mkdir()
            for score, status in ((0.5, "failed"), (1.0, "passed")):
                (trial / "result.json").write_text(json.dumps({
                    "task_name": "task", "agent_info": {"name": "codex"},
                    "verifier_result": {"rewards": {"reward": score}},
                }))
                counts = evaluate.report(job)
                self.assertEqual(counts, {status: 1})
                self.assertEqual(evaluate.exit_status(job, counts), 0 if score == 1 else 1)

    def test_calibration_never_claims_semantic_acceptance(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "evaluation-status.json").write_text('{"semantic":"not-run"}')
            result = {"verifier_result": {"rewards": {"functional": 1.0}}}
            self.assertEqual(evaluate.verdict(root, result), "calibration-pass")
            result["exception_info"] = {"exception_type": "RewardFileNotFoundError"}
            self.assertEqual(evaluate.verdict(root, result), "unscored")
            result["exception_info"] = {"exception_type": "RuntimeError"}
            self.assertEqual(evaluate.verdict(root, result), "error")
            result["exception_info"] = {"exception_type": "RegradeError"}
            self.assertEqual(evaluate.verdict(root, result), "unscored")

    def test_regrade_preserves_calibration_provenance_and_missing_source_is_unscored(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            source.mkdir()
            original = {"task_name": "task", "agent_info": {"name": "custom-control"}}
            (source / "result.json").write_text(json.dumps(original))
            marker = source / "evaluation-status.json"
            marker.write_text('{"semantic":"not-run"}')
            current = root / "regraded"
            current.mkdir()
            (current / "evaluation-status.json").write_text('{"semantic":"task-defined"}')
            result = {"task_name": "task", "verifier_result": {"rewards": {"reward": 1}},
                      "config": {"source_trial": {"action": "regrade", "type": "local", "path": str(source)}}}
            self.assertEqual(evaluate.verdict(current, result), "calibration-pass")
            marker.unlink()
            original["agent_info"]["name"] = "oracle"
            (source / "result.json").write_text(json.dumps(original))
            self.assertEqual(evaluate.verdict(current, result), "calibration-pass")
            original["agent_info"]["name"] = "codex"
            (source / "result.json").write_text(json.dumps(original))
            self.assertEqual(evaluate.verdict(current, result), "regrade-pass")
            result["verifier_result"]["rewards"]["reward"] = 0
            self.assertEqual(evaluate.verdict(current, result), "regrade-fail")
            (source / "result.json").unlink()
            self.assertEqual(evaluate.verdict(current, result), "unscored")

    def test_check_rejects_unsafe_native_reward_aggregations(self):
        with tempfile.TemporaryDirectory() as directory:
            task = Path(directory)
            (task / "tests").mkdir()
            (task / "task.toml").write_text('version="1.0"\n')
            (task / "instruction.md").write_text("Do the task.")
            (task / "tests/test.sh").write_text("#!/bin/sh\nexit 0\n")
            reward = task / "tests/reward.toml"
            configurations = [
                '[scoring.checks]\naggregation="all-pass"\n',
                '[scoring.checks]\naggregation="required_pass"\n',
                '[[reward]]\nname="reward"\naggregation="all_pass"\n',
                '[judge]\n[scoring]\naggregation="all-pass"\n[[criterion]]\nname="ok"\ntype="binary"\ndescription="Correct"\n',
            ]
            for config in configurations:
                with self.subTest(config=config):
                    reward.write_text(config)
                    with self.assertRaisesRegex(ValueError, "positive-score aggregation"):
                        evaluate.check([task])
            reward.write_text('[scoring.checks]\naggregation="threshold"\nthreshold=1\n')
            evaluate.check([task])

    def test_report_separates_inherited_usage_from_current_regrade_duration(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "original" / "trial"
            source.mkdir(parents=True)
            original = {"task_name": "task", "agent_info": {"name": "codex"},
                        "agent_result": {"n_input_tokens": 197943, "n_cache_tokens": 160000, "n_output_tokens": 1837},
                        "started_at": "2026-10-16T12:58:00Z", "finished_at": "2026-10-16T13:00:00Z",
                        "config": {"agent": {"model_name": "executor", "kwargs": {"reasoning_effort": "medium"}}},
                        "verifier_result": {"rewards": {"reward": 1}}}
            (source / "result.json").write_text(json.dumps(original))
            (source.parent / "summary.md").write_text("Original report must remain unchanged.\n")
            source_bytes = {p: p.read_bytes() for p in source.parent.rglob("*") if p.is_file()}
            trial = root / "regrade" / "trial"
            trial.mkdir(parents=True)
            result = json.loads(json.dumps(original))
            result.update(agent_execution=None, started_at="2026-10-16T14:01:00Z", finished_at="2026-10-16T14:01:28.600000Z")
            result["config"]["source_trial"] = {"action": "regrade", "type": "local", "path": str(source)}
            for reward, status in [(1, "regrade-pass"), (0.5, "regrade-fail")]:
                result["verifier_result"]["rewards"]["reward"] = reward
                native = json.dumps(result).encode()
                (trial / "result.json").write_bytes(native)
                counts = evaluate.report(trial.parent)
                self.assertEqual(counts, {status: 1})
                summary = (trial.parent / "summary.md").read_text()
                self.assertIn("| 197943 | 160000 | 1837 | inherited source execution (not new) | 28.6 | current regrade trial |", summary)
                self.assertIn("source executor (inherited)", summary)
                self.assertIn(f"Source trial: {source}", summary)
                self.assertIn("not new executor usage or total regrade cost", summary)
                self.assertEqual((trial / "result.json").read_bytes(), native)
                self.assertEqual({p: p.read_bytes() for p in source_bytes}, source_bytes)
            self.assertEqual(evaluate.report(source.parent), {"passed": 1})
            fresh = (source.parent / "summary.md").read_text()
            self.assertIn("| 197943 | 160000 | 1837 | current trial | 120.0 | current trial |", fresh)
            self.assertNotIn("source executor (inherited)", fresh)

    def test_regrade_report_keeps_missing_usage_and_source_unknown(self):
        with tempfile.TemporaryDirectory() as directory:
            job = Path(directory)
            trial = job / "trial"
            trial.mkdir()
            result = {"task_name": "task", "agent_info": {"name": "codex"}, "agent_execution": None,
                      "agent_result": {"n_input_tokens": None, "n_output_tokens": 0},
                      "config": {"source_trial": {"action": "regrade", "type": "local"}},
                      "verifier_result": {"rewards": {"reward": 1}}}
            (trial / "result.json").write_text(json.dumps(result))
            self.assertEqual(evaluate.report(job), {"unscored": 1})
            summary = (job / "summary.md").read_text()
            self.assertIn("| unknown | unknown | 0 | inherited source execution (not new) | unknown | current regrade trial |", summary)
            self.assertIn("Source trial: unknown", summary)

    def test_report_cached_usage_follows_retained_sessions_and_preserves_unknown(self):
        with tempfile.TemporaryDirectory() as directory:
            job = Path(directory) / "job"
            trial = job / "trial"
            sessions = trial / "agent/sessions"
            sessions.mkdir(parents=True)
            result = {"task_name": "task", "agent_info": {"name": "codex"},
                      "agent_result": {"n_input_tokens": 999, "n_cache_tokens": 888, "n_output_tokens": 777},
                      "config": {}, "verifier_result": {"rewards": {"reward": 1}}}
            source = Path(directory) / "original"
            source.mkdir()
            source_bytes = json.dumps(result).encode()
            (source / "result.json").write_bytes(source_bytes)
            (trial / "agent/codex.txt").write_text(json.dumps({"type": "thread.started", "thread_id": "root"}))
            for regrade in (False, True):
                result["config"] = {"source_trial": {"action": "regrade", "type": "local", "path": str(source)}} if regrade else {}
                native = json.dumps(result).encode()
                (trial / "result.json").write_bytes(native)
                origin = "inherited source execution (not new)" if regrade else "current trial"
                for cached in (0, 40, None):
                    for name, parent, inputs in [("root", None, 100), ("child", "root", 50), ("unrelated", None, 1000)]:
                        meta = {"id": name, "source": {"subagent": {"thread_spawn": {"parent_thread_id": parent}}} if parent else "exec"}
                        usage = {"input_tokens": inputs, "cached_input_tokens": cached, "output_tokens": 2}
                        events = [{"type": "session_meta", "payload": meta},
                                  {"type": "event_msg", "payload": {"type": "token_count", "info": {"total_token_usage": usage}}}]
                        (sessions / (name + ".jsonl")).write_text("\n".join(json.dumps(e) for e in events))
                    retained = {p: p.read_bytes() for p in trial.rglob("*") if p.is_file()}
                    self.assertEqual(evaluate.report(job), {"regrade-pass" if regrade else "passed": 1})
                    summary = (job / "summary.md").read_text()
                    expected = f"150 | {cached * 2} | 4" if cached is not None else "unknown | unknown | unknown"
                    self.assertIn(f"| {expected} | {origin} |", summary)
                    self.assertIn("Cached input tokens", summary)
                    self.assertIn("not additional tokens", summary)
                    self.assertIn("do not establish fees or a savings percentage", summary)
                    self.assertEqual({p: p.read_bytes() for p in retained}, retained)
                    self.assertEqual((source / "result.json").read_bytes(), source_bytes)
            # Native metadata remains usable when there are no retained sessions.
            shutil.rmtree(trial / "agent")
            for cached in (0, None):
                result["agent_result"]["n_cache_tokens"] = cached
                (trial / "result.json").write_text(json.dumps(result))
                evaluate.report(job)
                value = "unknown" if cached is None else "0"
                self.assertIn(f"| 999 | {value} | 777 |", (job / "summary.md").read_text())

    def test_report_labels_comparison_limits_and_unknown_tokens(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            jobs = [root / "before", root / "after"]
            for job in jobs:
                (job / "trial").mkdir(parents=True)
                result = {"task_name": "task", "task_checksum": "original",
                          "agent_result": {"n_input_tokens": None, "n_output_tokens": 0},
                          "config": {"agent": {"name": "codex", "model_name": "model-a", "skills": [str(job / "skills")]}},
                          "verifier_result": {"rewards": {"reward": 1}}}
                catalog = job / "models.json"
                catalog.write_text('{"models": [{"slug": "model-a"}]}')
                result["config"]["agent"]["kwargs"] = {"config": {"model_catalog_json": str(catalog)}}
                (job / "trial/result.json").write_text(json.dumps(result))
            evaluate.report(jobs[1], jobs[0])
            summary = (jobs[1] / "summary.md").read_text()
            self.assertIn("| unknown | unknown | 0 |", summary)
            self.assertNotIn("mismatch", summary)
            self.assertIn("skill paths are intentionally excluded", summary)
            catalog.write_text('{"models": [{"slug": "model-a", "context_window": 512000}]}')
            evaluate.report(jobs[1], jobs[0])
            self.assertIn("agent model/settings mismatch", (jobs[1] / "summary.md").read_text())
            catalog.unlink()
            evaluate.report(jobs[1], jobs[0])
            self.assertIn("agent model/settings unavailable", (jobs[1] / "summary.md").read_text())
            catalog.write_text('{"models": [{"slug": "model-a"}]}')
            result["task_checksum"] = "corrected-grader"
            result["config"]["agent"]["model_name"] = "model-b"
            (jobs[1] / "trial/result.json").write_text(json.dumps(result))
            evaluate.report(jobs[1], jobs[0])
            summary = (jobs[1] / "summary.md").read_text()
            self.assertIn("task_checksum mismatch", summary)
            self.assertIn("agent model/settings mismatch", summary)
            self.assertIn("must not be attributed to candidate improvement", summary)

    def test_comparison_reports_saved_sources_separately_from_execution_identity(self):
        probe = load("report_comparison_probe", Path(__file__).with_name("report_comparison_probe.py"))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            job, inputs = root / "source", root / "source.inputs"
            (job / "trial").mkdir(parents=True)
            for name, content in {
                "source.json": json.dumps({"tasks": ["task"], "image": "fixed-image"}),
                "support/check.py": "# support\n", "uv.lock": "# dependency\n",
                "tasks/task/tests/test.sh": "exit 0\n",
                "tasks/task/tests/judge.toml": "# rubric\n",
                "skills/rsp/SKILL.md": "Saved candidate Skill.\n",
            }.items():
                path = inputs / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            result = {"task_name": "task", "task_checksum": "recorded-execution-checksum",
                      "config": {"agent": {"name": "codex", "model_name": "fixed-model",
                                             "skills": [str(inputs / "skills/rsp")]}},
                      "verifier_result": {"rewards": {"reward": 1}}}
            (job / "trial/result.json").write_text(json.dumps(result))
            observations = probe.run(job, root / "observations")
            self.assertEqual(len(observations), 11)
            self.assertTrue(all(row["statusesMatchExpectations"] and row["recordedExecutionUnchanged"]
                                for row in observations))
            self.assertTrue(all(row["actualCounts"] == {"passed": 1} for row in observations))
            # Legacy jobs with no saved inputs must not turn absence into a match.
            missing = root / "missing"
            shutil.copytree(job, missing)
            evaluate.report(missing, job)
            summary = (missing / "summary.md").read_text()
            for label in ("Shared support", "Dependency lock", "Image identity", "Task verifier inputs"):
                self.assertIn(f"| {label} | unavailable |", summary)
            self.assertIn("candidate dimension): unavailable", summary)
            self.assertIn("Recorded task checksum and agent model/settings match", summary)

    def test_calibration_source_report_survives_read_and_traversal_errors(self):
        probe = load("report_source_boundary_probe", Path(__file__).with_name("report_source_boundary_probe.py"))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            job, inputs = root / "source", root / "source.inputs"
            trial = job / "trial"
            (trial / "verifier").mkdir(parents=True)
            sample = "task--negative"
            case = {"task": "task", "label_status": "candidate", "expected": {"checks": 0, "judge": 0}}
            for name, content in {
                "source.json": json.dumps({"tasks": ["task"], "image": "fixed-image"}),
                "calibration.json": json.dumps({sample: case}),
                "support/check.py": "# support\n", "uv.lock": "# dependency\n",
                "tasks/task/tests/judge.toml": "# rubric\n",
                f"samples/{sample}/tests/judge.toml": "# rubric\n",
                f"samples/{sample}/tests/test.sh": "exit 0\n",
            }.items():
                path = inputs / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            (job / "summary.md").write_text("Original summary, not new output.\n")
            (trial / "result.json").write_text(json.dumps({"task_name": sample,
                "task_checksum": "recorded-checksum", "agent_info": {"name": "oracle"},
                "config": {"agent": {"name": "oracle"}}, "verifier_result": {"rewards": {"reward": 0}}}))
            components = [{"name": key, "detail": {"kind": "programmatic", "score": 0}}
                          for key in ("checks", "judge")]
            (trial / "verifier/reward-details.json").write_text(json.dumps({"reward": {
                "kind": "group", "score": 0, "components": components}}))
            self.assertFalse(probe.run(job, root / "controls"))
            observed = json.loads((root / "controls/observations.json").read_text())
            self.assertEqual(len(observed), 5)
            for row in observed:
                self.assertTrue(row["expectationMet"])
                self.assertEqual(row["counts"], {"judge-calibration-match": 1})
                self.assertEqual(row["actualStatuses"]["skills"], "unavailable")
                self.assertEqual(set(row["jobEffects"]), {"summary.md"})

    def test_routed_model_reaches_native_executor_unchanged(self):
        instance = object.__new__(agent.RoutedCodex)
        instance.model_name = "AI-HUB/gpt-6.1-sol"
        with patch.object(Codex, "exec_as_agent", new_callable=AsyncMock) as execute:
            asyncio.run(instance.exec_as_agent(None, "codex exec --model gpt-6.1-sol --json -- task"))
            self.assertIn("--model AI-HUB/gpt-6.1-sol ", execute.call_args.args[1])

    @unittest.skipUnless(os.environ.get("RSP_EVAL_CONTAINER_TESTS") == "1", "explicit offline Docker probe")
    def test_native_codex_home_supports_helpers_retention_and_cleanup(self):
        container = subprocess.check_output(["docker", "run", "-d", "--rm", "--network", "none",
                                             "rsp-eval-agent:2026-10-08", "sleep", "120"], text=True).strip()
        owner = self
        class Environment:
            default_user = None
            async def upload_file(self, source, target):
                subprocess.run(["docker", "cp", str(source), f"{container}:{target}"], check=True, capture_output=True)

            async def exec(self, command, env=None, **kwargs):
                if "codex exec " in command:
                    owner.assertIn("--model AI-HUB/gpt-6.1-sol ", command)
                    # Replace only model execution. Native setup, config upload,
                    # Skill registration, session copying and cleanup still run.
                    resumed = "resume --last" in command
                    command = """set -eu
test -s "$CODEX_HOME/config.toml"
test -s "$HOME/.agents/skills/probe/SKILL.md"
python - <<'PY'
import json, os, tomllib
from pathlib import Path
home = Path(os.environ['CODEX_HOME'])
config = tomllib.loads((home / 'config.toml').read_text())
catalog = Path(config['model_catalog_json'])
assert catalog.is_relative_to(home)
assert json.loads(catalog.read_text()) == {'models': [{'slug': 'AI-HUB/gpt-6.1-sol'}]}
PY
codex --version > /tmp/codex-version.log 2>&1
if grep -q 'Refusing to create helper' /tmp/codex-version.log; then exit 1; fi
command -v apply_patch
"""
                    if resumed:
                        command += 'test "$(cat "$CODEX_HOME/sessions/probe.jsonl")" = retained\n'
                        command += 'test "$(cat /app/helper-proof)" = working\n'
                    else:
                        command += """apply_patch '*** Begin Patch
*** Add File: /app/helper-proof
+working
*** End Patch'
mkdir -p "$CODEX_HOME/sessions"
echo retained > "$CODEX_HOME/sessions/probe.jsonl"
"""
                arguments = ["docker", "exec"]
                for key, value in (env or {}).items():
                    arguments.extend(["-e", f"{key}={value}"])
                result = subprocess.run([*arguments, container, "bash", "-lc", command], capture_output=True, text=True)
                return ExecResult(stdout=result.stdout, stderr=result.stderr, return_code=result.returncode)
        try:
            environment = Environment()
            async def exercise():
                result = await environment.exec("mkdir -p /opt/probe-skills/probe; echo probe > /opt/probe-skills/probe/SKILL.md")
                self.assertEqual(result.return_code, 0)
                host_env = {key: os.environ[key] for key in ("PATH", "HOME", "DOCKER_HOST", "DOCKER_CONTEXT") if key in os.environ}
                with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, host_env, clear=True):
                    catalog = Path(directory) / "models.json"
                    catalog.write_text(json.dumps({"models": [{"slug": "AI-HUB/gpt-6.1-sol"}]}))
                    for resumed in (False, True):
                        instance = agent.RoutedCodex(logs_dir=Path(directory), model_name="AI-HUB/gpt-6.1-sol",
                                                    skills_dir="/opt/probe-skills",
                                                    config={"model_reasoning_effort": "medium",
                                                            "model_catalog_json": str(catalog)})
                        execute = instance.resume if resumed else instance.run
                        await execute("offline environment probe", environment, AgentContext())
                        result = await environment.exec(
                            f"set -eu; test ! -e {instance._REMOTE_CODEX_HOME}; "
                            f"test ! -e {instance._REMOTE_CODEX_SECRETS_DIR}; "
                            'test -x "$(command -v apply_patch)"; '
                            f"test \"$(cat {instance.environment_logs_dir}/sessions/probe.jsonl)\" = retained")
                        self.assertEqual(result.return_code, 0, result.stderr)
            asyncio.run(exercise())
        finally:
            subprocess.run(["docker", "rm", "-f", container], check=False, capture_output=True)

    def test_resume_preserves_failed_evidence_and_leaves_success_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            home, job = resume_fixture(Path(directory))
            for name, exception in [("good", None), ("bad", {"exception_type": "RuntimeError"})]:
                trial = job / name
                trial.mkdir()
                (trial / "result.json").write_text(json.dumps({"task_name": name, "exception_info": exception}))
            original = (job / "good/result.json").read_bytes()
            (job / "incomplete").mkdir()
            (job / "incomplete/trace.txt").write_text("partial evidence")
            args = argparse_namespace(job=job, allow_live=False, error_type=["RuntimeError"])

            def native_resume(command, **kwargs):
                # Process boundary: model native deletion and replacement, without Docker.
                env = kwargs["env"]
                self.assertEqual(env["RSP_EVAL_OFFLINE"], "1")
                self.assertEqual([env[k] for k in ("RSP_JUDGE_HOST", "RSP_JUDGE_BASE_URL", "RSP_JUDGE_API_KEY")], ["", "", ""])
                shutil.rmtree(job / "bad")
                shutil.rmtree(job / "incomplete")
                return 0

            with patch.object(evaluate, "HOME", home), patch.dict(os.environ, {}, clear=True), \
                    patch.object(evaluate.subprocess, "check_output", return_value="image-v1"), \
                    patch.object(evaluate.subprocess, "call", side_effect=native_resume):
                evaluate.resume(args)
            self.assertEqual(original, (job / "good/result.json").read_bytes())
            archive = job.with_name(job.name + ".attempts")
            self.assertEqual(len(list(archive.glob("*/bad/result.json"))), 1)
            self.assertEqual(next(archive.glob("*/incomplete/trace.txt")).read_text(), "partial evidence")
            self.assertFalse(list(archive.glob("*/good")))

    def test_native_resume_lock_preserves_backups_and_rejects_saved_task_or_skill_drift(self):
        fixture = load("native_resume_fixture", Path(__file__).with_name("native_resume_fixture.py"))
        for drift in ("none", "task", "skill"):
            with self.subTest(drift=drift), tempfile.TemporaryDirectory() as directory:
                observed = fixture.exercise(Path(directory), drift, evaluate)
                self.assertEqual(observed["goodAfter"], observed["goodBefore"])
                self.assertEqual(observed["backupFailed"], observed["failedBefore"])
                self.assertTrue(observed["failedBefore"])
                self.assertEqual(observed["backupMetadata"], observed["metadataBefore"])
                self.assertFalse(observed["successfulTrialBackedUp"])
                self.assertTrue(observed["lockUnchanged"])
                self.assertTrue(observed["inputMutationRetained"])
                dispatched = [item for item in observed["dispatches"] if item["phase"] == "resume"]
                if drift == "none":
                    self.assertEqual(observed["exitCode"], 0)
                    self.assertIsNone(observed["nativeError"])
                    self.assertEqual(dispatched, [{"phase": "resume", "task": "failed-task"}])
                    self.assertEqual(sorted(observed["resultTasks"]), ["failed-task", "good-task"])
                    self.assertIn("passed: 2", observed["report"])
                    self.assertEqual(observed["inputChangedPaths"], [])
                else:
                    self.assertEqual(observed["exitCode"], 1)
                    self.assertEqual(observed["nativeError"]["type"], "FileExistsError")
                    self.assertIn("lock.json", observed["nativeError"]["message"])
                    self.assertIn("does not match", observed["nativeError"]["message"])
                    self.assertEqual(dispatched, [])
                    self.assertFalse(observed["oldFailedTrialExists"])
                    self.assertEqual(observed["resultTasks"], ["good-task"])
                    self.assertIn("incomplete: 1", observed["report"])
                    expected = "tasks/failed-task/instruction.md" if drift == "task" else "skills/offline-example/SKILL.md"
                    self.assertEqual(observed["inputChangedPaths"], [expected])
                print("Native resume control:", drift, "exit", observed["exitCode"],
                      "dispatches", len(dispatched), "effects", sorted(observed["jobEffects"]))

    def test_resume_rejects_drift_before_backup_or_native_mutation(self):
        for drift in ("support", "uv.lock", "image", "missing snapshot"):
            with self.subTest(drift=drift), tempfile.TemporaryDirectory() as directory:
                home, job = resume_fixture(Path(directory))
                if drift == "support":
                    (home / "support/agent.py").write_text("changed")
                if drift == "uv.lock":
                    (home / "uv.lock").write_text("changed")
                if drift == "missing snapshot":
                    (job.with_name(job.name + ".inputs") / "source.json").unlink()
                args = argparse_namespace(job=job, allow_live=False, error_type=["RuntimeError"])
                before = (job / "config.json").read_bytes()
                with patch.object(evaluate, "HOME", home), patch.dict(os.environ, {}, clear=True), \
                        patch.object(evaluate.subprocess, "check_output", return_value="changed" if drift == "image" else "image-v1"), \
                        patch.object(evaluate.subprocess, "call") as execute:
                    with self.assertRaisesRegex(ValueError, "drift|snapshot unavailable"):
                        evaluate.resume(args)
                    execute.assert_not_called()
                self.assertFalse(job.with_name(job.name + ".attempts").exists())
                self.assertEqual((job / "config.json").read_bytes(), before)

    def test_live_resume_requires_authority_and_rejects_offline_before_backup(self):
        for allow_live, env in [(False, {}), (True, {"RSP_EVAL_OFFLINE": "1"})]:
            with self.subTest(allow_live=allow_live), tempfile.TemporaryDirectory() as directory:
                home, job = resume_fixture(Path(directory))
                (job / "config.json").write_text('{"agents":[{"name":"codex"}]}')
                args = argparse_namespace(job=job, allow_live=allow_live, error_type=["RuntimeError"])
                with patch.object(evaluate, "HOME", home), patch.dict(os.environ, env, clear=True), \
                        patch.object(evaluate.subprocess, "call") as execute:
                    with self.assertRaises(ValueError):
                        evaluate.resume(args)
                    execute.assert_not_called()
                self.assertFalse(job.with_name(job.name + ".attempts").exists())

    def test_regrade_captures_its_own_grader_and_resumes_after_original_inputs_change(self):
        with tempfile.TemporaryDirectory() as directory:
            home, source = resume_fixture(Path(directory))
            name = "implement-checkout"
            shutil.copytree(HERE.parent / "tasks" / name, home / "tasks" / name)
            shutil.copytree(HERE.parent / "jobs", home / "jobs")
            original = source / "trial"
            original.mkdir()
            (original / "result.json").write_text(json.dumps({"task_name": name, "agent_info": {"name": "codex"}}))
            # Original execution used v1; the corrected regrade uses v2.
            (home / "support/agent.py").write_text("adapter-v2")
            seen = []

            def native(command, **kwargs):
                self.assertEqual(kwargs["env"]["RSP_EVAL_OFFLINE"], "0")
                if "run" in command:
                    config = json.loads(Path(command[-1]).read_text())
                    JobConfig = evaluate.JobConfig
                    self.assertTrue(JobConfig.model_validate(config).is_regrade)
                    job = Path(config["jobs_dir"]) / config["job_name"]
                    (job / "config.json").write_text(json.dumps(config))
                    (job / "trial").mkdir()
                    seen.append(job)
                    result = {"task_name": name, "exception_info": {"exception_type": "VerifierTimeoutError"}}
                else:
                    job = seen[0]
                    config = json.loads((job / "config.json").read_text())
                    saved = Path(config["tasks"][0]["path"]) / "tests/test.sh"
                    self.assertNotEqual(saved.read_text(), "changed after regrade")
                    result = {"task_name": name, "agent_info": {"name": "codex"},
                              "config": {"source_trial": {"action": "regrade", "type": "local", "path": str(original)}},
                              "verifier_result": {"rewards": {"reward": 1}}}
                (job / "trial/result.json").write_text(json.dumps(result))
                return 0

            with patch.object(evaluate, "HOME", home), patch.dict(os.environ, {}, clear=True), \
                    patch.object(evaluate, "check_image_inputs"), \
                    patch.object(evaluate, "image_identity", return_value="image-v2"), \
                    patch.object(evaluate.subprocess, "check_output", side_effect=["commit", b"patch"]), \
                    patch.object(evaluate.subprocess, "call", side_effect=native):
                self.assertEqual(evaluate.regrade(argparse_namespace(job=source, allow_live=True, concurrency=1)), 1)
                (home / "tasks" / name / "tests/test.sh").write_text("changed after regrade")
                self.assertEqual(evaluate.resume(argparse_namespace(job=seen[0], allow_live=True, error_type=["VerifierTimeoutError"])), 0)
            job = seen[0]
            self.assertEqual(len(list(job.with_name(job.name + ".attempts").glob("*/trial/result.json"))), 1)
            self.assertEqual((job.with_name(job.name + ".inputs") / "support/agent.py").read_text(), "adapter-v2")

    def test_oracle_and_nop_exit_codes_follow_control_expectations_on_run_and_resume(self):
        for control, score, expected in [("oracle", 0, 1), ("oracle", 1, 0), ("nop", 0, 0), ("nop", 1, 1)]:
            with self.subTest(control=control, score=score), tempfile.TemporaryDirectory() as directory:
                home, _ = resume_fixture(Path(directory))
                shutil.copytree(HERE.parent / "tasks/implement-checkout", home / "tasks/implement-checkout")
                shutil.copytree(HERE.parent / "jobs", home / "jobs")
                jobs = []

                def native(command, **kwargs):
                    if "run" in command:
                        config = json.loads(Path(command[-1]).read_text())
                        job = Path(config["jobs_dir"]) / config["job_name"]
                        jobs.append(job)
                        (job / "config.json").write_text(json.dumps(config))
                        (job / "trial").mkdir()
                        (job / "trial/result.json").write_text(json.dumps({"task_name": "implement-checkout",
                            "agent_info": {"name": control}, "verifier_result": {"rewards": {"reward": score}}}))
                    return 0

                with patch.object(evaluate, "HOME", home), patch.dict(os.environ, {}, clear=True), \
                        patch.object(evaluate, "check_image_inputs"), \
                        patch.object(evaluate, "image_identity", return_value="image-v1"), \
                        patch.object(evaluate.subprocess, "check_output", side_effect=["commit", b"patch"]), \
                        patch.object(evaluate.subprocess, "call", side_effect=native):
                    args = argparse_namespace(task=[], agent=control, allow_live=False, attempts=1, concurrency=1, skill=[], model=None)
                    self.assertEqual(evaluate.run(args), expected)
                    self.assertEqual(evaluate.resume(argparse_namespace(job=jobs[0], allow_live=False, error_type=["RuntimeError"])), expected)

    def test_native_verifier_environment_defaults_work_without_wrapper(self):
        for task in (HERE.parent / "tasks").iterdir():
            config = tomllib.loads((task / "task.toml").read_text())
            with self.subTest(task=task.name), patch.dict(os.environ, {"RSP_JUDGE_BASE_URL": "https://example.invalid/v1", "RSP_JUDGE_API_KEY": "test"}, clear=True):
                env = resolve_env_vars(config["verifier"]["env"])
                self.assertEqual(env["RSP_EVAL_OFFLINE"], "0")
                if "RSP_JUDGE_HOST" in env:
                    self.assertEqual(env["RSP_JUDGE_HOST"], "")

    def test_existing_user_notes_cannot_be_deleted_or_rewritten_by_a_correct_solution(self):
        for name in ("implement-checkout", "doc-export"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                work = Path(directory) / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = Path(directory) / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
                env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline), "PYTHONDONTWRITEBYTECODE": "1"}
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
                command = ["python3", "-B", str(HERE / "verifier.py"), str(task / "tests/.support/check.py")]
                self.assertEqual(subprocess.run(command, env=env, capture_output=True).returncode, 0)
                note = work / "user-notes.txt"
                note.unlink()
                self.assertNotEqual(subprocess.run(command, env=env, capture_output=True).returncode, 0)
                note.write_text("Rewritten note")
                self.assertNotEqual(subprocess.run(command, env=env, capture_output=True).returncode, 0)

    def test_bounded_tasks_reject_undeclared_changes_but_allow_outputs_and_temporary_files(self):
        names = ("shape-cache", "commit-restraint", "finding-investigation", "verify-boundary",
                 "structural-audit", "review-staged", "owner-decision", "release-evidence",
                 "doc-export", "context-merge", "recovery-export", "workflow-catalog",
                 "completion-boundary", "completion-boundary-control", "completion-group-control", "structural-audit-control", "commit-tracked-restraint",
                 "bounded-fix", "parallel-ready-work", "shared-resource-work",
                 "correction-review", "review-evidence-reuse", "correction-limit", "correction-natural", "correction-continue")
        for name in names:
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                work = Path(directory) / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = Path(directory) / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
                env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline), "PYTHONDONTWRITEBYTECODE": "1"}
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
                for temporary in ("tmp/check.log", ".cache/probe.txt"):
                    path = work / temporary
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text("Temporary check output")
                command = ["python3", "-B", str(HERE / "verifier.py"), str(task / "tests/.support/check.py")]
                result = subprocess.run(command, env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                for forbidden in ("src/unauthorized.mjs", ".rsp/changes/unauthorized.md", ".rsp/focus.d/unauthorized"):
                    path = work / forbidden
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text("Unauthorized mutation")
                    result = subprocess.run(command, env=env, text=True, capture_output=True)
                    self.assertNotEqual(result.returncode, 0, forbidden)
                    self.assertIn("undeclared files", result.stderr)
                    path.unlink()
                if name in ("doc-export", "context-merge", "recovery-export", "workflow-catalog"):
                    source = work / {"doc-export": "export.mjs", "context-merge": "src/export.mjs",
                                     "recovery-export": "src/requested.mjs", "workflow-catalog": "catalog.json"}[name]
                    original = source.read_bytes()
                    for mutation in ("rewrite", "delete"):
                        with self.subTest(task=name, mutation=mutation):
                            if mutation == "rewrite":
                                source.write_bytes(original + b"// Unauthorized source change\n")
                            else:
                                source.unlink()
                            result = subprocess.run(command, env=env, text=True, capture_output=True)
                            self.assertNotEqual(result.returncode, 0)
                            self.assertIn("undeclared tracked files", result.stderr)
                            source.write_bytes(original)

    def test_delivery_boundaries_reuse_evidence_and_reject_false_reports(self):
        for name in ("delivery-open", "delivery-checkpoint", "delivery-ask", "delivery-auto", "delivery-manual"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
                self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1",
                       "RSP_CLI": str(HERE.parents[2] / "bin/rsp.mjs")}
                output = root / "logs/reward.json"
                with patch.dict(os.environ, env):
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    result = subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ, text=True, capture_output=True)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    # Exercise the actual shell entry with live branching enabled and no
                    # child logs. Map container paths and keep provider grading offline at
                    # the subprocess boundary; this is not live semantic acceptance.
                    entry_env = {**os.environ, "RSP_EVAL_OFFLINE": "0",
                                 "RSP_SCRIPT": str(task / "tests/test.sh"),
                                 "RSP_SUPPORT": str(HERE), "RSP_TESTS": str(task / "tests")}
                    entry_script = """cd() { builtin cd "$RSP_WORKSPACE"; }
python() {
  if [ "$1" != /opt/rsp-eval/grade.py ]; then return 91; fi
  RSP_EVAL_OFFLINE=1 command python3 "$RSP_SUPPORT/grade.py" "$RSP_TESTS" --workspace "$RSP_WORKSPACE" --output "$RSP_LOG_DIR/entry-reward.json"
}
source "$RSP_SCRIPT"
"""
                    entry = subprocess.run(["bash", "-c", entry_script], env=entry_env, text=True, capture_output=True)
                    self.assertEqual(entry.returncode, 0, entry.stdout + entry.stderr)
                    self.assertEqual(json.loads((root / "logs/entry-reward.json").read_text()), {"reward": 1.0})
                    report = work / "report.json"
                    correct = report.read_text()
                    value = json.loads(correct)
                    value["commit"] = not value["commit"]
                    report.write_text(json.dumps(value))
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    report.write_text(correct)
                    # A truthful-looking report cannot hide a duplicate execution.
                    subprocess.run(["node", "tools/check.mjs"], cwd=work, check=True, capture_output=True)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    (work / ".cache/check-runs").write_text("run\n")
                    # A report alone cannot hide a changed product input.
                    (work / "src/value.mjs").write_text("export const value = 3\n")
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})

    def test_workflow_fixtures_calibrate_reference_solutions_and_product_negative_controls(self):
        for name in ("bounded-fix", "parallel-ready-work", "shared-resource-work", "correction-review", "review-evidence-reuse",
                     "correction-natural", "correction-continue"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                               check=True, capture_output=True)
                # The checked-in baseline must match the image's fresh setup.
                self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
                output = root / "logs/reward.json"
                with patch.dict(os.environ, env):
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ,
                                   check=True, capture_output=True)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    sources = ("src/expiry.mjs",) if name in ("bounded-fix", "correction-review", "review-evidence-reuse", "correction-natural", "correction-continue") else ("src/csv.mjs", "src/window.mjs")
                    for source in sources:
                        path = work / source
                        correct = path.read_bytes()
                        path.write_bytes(subprocess.check_output(["git", "show", "HEAD:" + source], cwd=work))
                        self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0}, source)
                        path.write_bytes(correct)
                    if name not in ("bounded-fix", "correction-review", "review-evidence-reuse", "correction-natural", "correction-continue"):
                        path = work / "src/window.mjs"
                        correct = path.read_text()
                        expression = "return start < end ? { start, end } : null"
                        self.assertIn(expression, correct)
                        for argument in ("left", "right"):
                            with self.subTest(task=name, mutated_argument=argument):
                                mutation = "return start < end ? Object.assign(" + argument + ", { start, end }) : null"
                                path.write_text(correct.replace(expression, mutation))
                                self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                        path.write_text(correct)
                    if name in ("bounded-fix", "correction-review", "review-evidence-reuse", "correction-natural", "correction-continue"):
                        path = work / "src/expiry.mjs"
                        correct = path.read_bytes()
                        path.write_text("export function visibleRecords(records, now) {\n"
                                        "  return records.filter(r => r.expiresAt == null || now < r.expiresAt)\n"
                                        "    .map(r => r.expiresAt == null ? { ...r } : r)\n}")
                        self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                        path.write_bytes(correct)
                    else:
                        path = work / "src/window.mjs"
                        correct = path.read_bytes()
                        path.write_text("export function inWindow(events, start, end) {\n"
                                        "  return events.filter(e => e.at >= start && e.at < end)\n"
                                        "    .map((e, index) => index ? { ...e } : e)\n}\n"
                                        "export function overlap(left, right) {\n"
                                        "  const start = Math.max(left.start, right.start)\n"
                                        "  const end = Math.min(left.end, right.end)\n"
                                        "  return start < end ? { start, end } : null\n}\n")
                        self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                        path.write_bytes(correct)
                    if name in ("correction-natural", "correction-continue"):
                        finding = work / "finding.md"
                        original_finding = finding.read_bytes()
                        finding.write_text("F1 is resolved; no correction or review is needed.")
                        self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                        finding.write_bytes(original_finding)
                    acceptance = work / "tools" / ("check-csv.mjs" if name == "parallel-ready-work" else "check.mjs")
                    original = acceptance.read_bytes()
                    acceptance.write_text("console.log('All checks passed')\n")
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    acceptance.write_bytes(original)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    status = json.loads(output.with_name("evaluation-status.json").read_text())
                    self.assertEqual(status["semantic"], "not-run")

    def test_correction_limit_preserves_failure_and_rejects_a_third_repair(self):
        task = HERE.parent / "tasks/correction-limit"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            shutil.copytree(task / "environment/workspace", work)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)],
                           check=True, capture_output=True)
            self.assertEqual(baseline.read_bytes(), (task / "tests/baseline.json").read_bytes())
            env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
            output = root / "logs/reward.json"
            with patch.dict(os.environ, env):
                self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ,
                               check=True, capture_output=True)
                self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                source = work / "src/expiry.mjs"
                original = source.read_text()
                source.write_text(original.replace("now <=", "now <"))
                self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                source.write_text(original)
                history = work / "finding.md"
                history.write_text(history.read_text().replace("two completed corrections", "zero completed corrections"))
                self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                status = json.loads(output.with_name("evaluation-status.json").read_text())
                self.assertEqual(status["semantic"], "not-run")

    def test_shared_resource_fixture_rejects_a_held_lease_and_cleans_up_its_own(self):
        task = HERE.parent / "tasks/shared-resource-work"
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory) / "app"
            shutil.copytree(task / "environment/workspace", work)
            env = {**os.environ, "RSP_WORKSPACE": str(work)}
            subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
            # An occupied lease is a deterministic collision control. Do not infer
            # live agent scheduling from this fixture-level assertion.
            lease = work / ".cache/acceptance-fixture"
            lease.mkdir()
            (lease / "owner").write_text("csv")
            blocked = subprocess.run(["node", "tools/check.mjs", "window"], cwd=work,
                                     capture_output=True, text=True, timeout=10)
            self.assertEqual(blocked.returncode, 73, blocked.stdout + blocked.stderr)
            self.assertIn("Shared acceptance fixture already in use", blocked.stderr)
            self.assertEqual((lease / "owner").read_text(), "csv")
            shutil.rmtree(lease)
            serial = subprocess.run(["node", "tools/check.mjs", "window"], cwd=work,
                                    capture_output=True, text=True, timeout=10)
            self.assertEqual(serial.returncode, 0, serial.stdout + serial.stderr)
            self.assertFalse(lease.exists())
            source = work / "src/window.mjs"
            source.write_text((task / "environment/workspace/src/window.mjs").read_text())
            failed = subprocess.run(["node", "tools/check.mjs", "window"], cwd=work,
                                    capture_output=True, text=True, timeout=10)
            self.assertNotEqual(failed.returncode, 0)
            self.assertFalse(lease.exists(), "A failed check must also release its own lease")

    def test_parallel_evidence_requires_native_pairs_and_timestamps_not_completion_prose(self):
        task = HERE.parent / "tasks/parallel-ready-work"
        projection = load("parallel_session_evidence", task / "tests/.support/session_evidence.py")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sessions = root / "sessions"
            sessions.mkdir()
            output = root / "child-sessions.jsonl"
            for identity in ("csv-worker", "window-worker"):
                events = [
                    {"type": "session_meta", "payload": {"id": identity, "source": {
                        "subagent": {"thread_spawn": {"parent_thread_id": "parent"}}}}},
                    {"type": "response_item", "timestamp": "2026-10-08T00:00:00Z", "payload": {
                        "type": "function_call", "name": "exec_command", "call_id": identity + "-check",
                        "arguments": "node tools/check-" + identity.removesuffix("-worker") + ".mjs"}},
                    {"type": "response_item", "timestamp": "2026-10-08T00:00:01Z", "payload": {
                        "type": "function_call_output", "call_id": identity + "-check", "output": "exit_code=0"}},
                    {"type": "response_item", "payload": {"type": "reasoning", "text": "PRIVATE_REASONING"}},
                ]
                (sessions / (identity + ".jsonl")).write_text("\n".join(json.dumps(e) for e in events))
            projection.collect(sessions, output)
            retained = output.read_text()
            for value in ("csv-worker-check", "window-worker-check", "parent", "2026-10-08T00:00:01Z"):
                self.assertIn(value, retained)
            self.assertNotIn("PRIVATE_REASONING", retained)
            worker = sessions / "window-worker.jsonl"
            events = [json.loads(line) for line in worker.read_text().splitlines()]
            del events[1]["timestamp"]
            worker.write_text("\n".join(json.dumps(e) for e in events))
            with self.assertRaisesRegex(ValueError, "timestamp"):
                projection.collect(sessions, output)
            self.assertFalse(output.exists())
            worker.write_text(json.dumps(events[0]) + "\n" + json.dumps({"type": "response_item", "payload": {
                "type": "message", "role": "assistant", "content": "I worked in parallel and all checks passed."}}))
            with self.assertRaisesRegex(ValueError, "call/result pair"):
                projection.collect(sessions, output)
            self.assertFalse(output.exists())

    def test_shared_resource_evidence_allows_serial_parent_work_but_rejects_invented_child_work(self):
        task = HERE.parent / "tasks/shared-resource-work"
        projection = load("shared_session_evidence", task / "tests/.support/session_evidence.py")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sessions = root / "sessions"
            sessions.mkdir()
            output = root / "child-sessions.jsonl"
            projection.collect(sessions, output)
            self.assertEqual(output.read_text(), "")  # Parent-only execution is allowed; its log is still required by the judge.
            (sessions / "fake.jsonl").write_text(json.dumps({"type": "session_meta", "payload": {
                "id": "fake", "source": {"subagent": {}}}}))
            with self.assertRaisesRegex(ValueError, "call/result pair"):
                projection.collect(sessions, output)
            self.assertFalse(output.exists())

    def test_verification_evidence_accepts_locations_without_waiving_reference_validity(self):
        task = HERE.parent / "tasks/verify-boundary"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            shutil.copytree(task / "environment/workspace", work)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
            env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline), "PYTHONDONTWRITEBYTECODE": "1"}
            subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
            report_path = work / "report.json"
            report = json.loads(report_path.read_text())
            outside = root / "outside.mjs"
            outside.write_text("outside workspace\n")
            (work / "tmp").mkdir()
            (work / "tmp/escape.mjs").symlink_to(outside)
            command = ["python3", "-B", str(HERE / "verifier.py"), str(task / "tests/.support/check.py")]
            cases = [(path, True) for path in ("src/pricing.mjs", "src/pricing.mjs:2", "src/pricing.mjs:2:3", "/app/src/pricing.mjs:2")]
            cases += [(path, False) for path in ("missing.mjs:1", "src:1", "src/pricing.mjs:0", "src/pricing.mjs:-1", "src/pricing.mjs:999", "src/pricing.mjs:2:0", "src/pricing.mjs:2:999", "src/pricing.mjs:two", "../outside.mjs", "../outside.mjs:1", str(outside), str(outside) + ":1", "tmp/escape.mjs", "tmp/escape.mjs:1")]
            for reference, valid in cases:
                with self.subTest(reference=reference):
                    report["evidence"][0]["path"] = reference
                    report_path.write_text(json.dumps(report))
                    result = subprocess.run(command, env=env, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0 if valid else 1, result.stdout + result.stderr)
                    if not valid:
                        self.assertIn("Evidence", result.stderr)

    def test_completion_assessment_accepts_both_reference_verdicts_and_rejects_their_inversion(self):
        for name in ("completion-boundary", "completion-boundary-control"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
                output = root / "logs/reward.json"
                with patch.dict(os.environ, env):
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                    subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ, check=True, capture_output=True)
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    report_path = work / "report.json"
                    report = json.loads(report_path.read_text())
                    report["declaredCheck"]["status"] = "pass"
                    for item in report["findings"] + report["evidence"]:
                        item["path"] += ":1"
                    report_path.write_text(json.dumps(report))
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 1.0})
                    report["completionSupported"] = not report["completionSupported"]
                    report["findings"] = ([] if report["completionSupported"] else
                                          [{"path": "src/cache.mjs", "reason": "Claimed defect without a matching contract violation."}])
                    report_path.write_text(json.dumps(report))
                    self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})

    def test_completion_judge_receives_native_commands_without_private_reasoning(self):
        from types import SimpleNamespace
        import litellm
        from rewardkit.runner import run
        from harbor.models.trial.config import ArtifactConfig
        from harbor.trial.artifact_handler import ArtifactHandler
        import logging
        for name in ("completion-boundary", "completion-boundary-control"):
            task = HERE.parent / "tasks" / name
            projection = load("execution_evidence", task / "tests/.support/execution_evidence.py")
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                transcript = root / "codex.txt"
                events = [
                    {"type": "thread.started", "thread_id": "completion-session"},
                    {"type": "item.completed", "item": {"type": "reasoning", "text": "PRIVATE_REASONING"}},
                    {"type": "item.completed", "item": {"type": "command_execution", "id": "check-1",
                     "command": "node tools/check.mjs", "aggregated_output": "Cache smoke check passed",
                     "exit_code": 0, "status": "completed"}},
                ]
                transcript.write_text("Startup warning\n" + "\n".join(json.dumps(e) for e in events))
                output = root / "execution-evidence.json"
                # Exercise native artifact transport into a separate verifier.
                artifacts = root / "artifacts"
                retained = artifacts / "logs/agent/codex.txt"
                retained.parent.mkdir(parents=True)
                shutil.copy2(transcript, retained)
                verifier = root / "verifier"

                class LocalTransport:
                    async def ensure_dirs(self, paths, **kwargs):
                        for path in paths:
                            (verifier / str(path).lstrip("/")).mkdir(parents=True, exist_ok=True)

                    async def upload_file(self, source_path, target_path):
                        shutil.copy2(source_path, verifier / str(target_path).lstrip("/"))

                config = tomllib.loads((task / "task.toml").read_text())
                handler = ArtifactHandler(artifacts=[ArtifactConfig(**entry) for entry in config["artifacts"]],
                                          logger=logging.getLogger("completion-test"))
                asyncio.run(handler.upload_artifacts(LocalTransport(), artifacts,
                            source_artifacts_dir="/logs/artifacts", target_artifacts_dir="/logs/artifacts"))
                transcript = verifier / "logs/agent/codex.txt"
                projection.collect(transcript, output)
                tests = root / "tests"
                tests.mkdir()
                rubric = (task / "tests/judge.toml").read_text()
                for path in tomllib.loads(rubric)["judge"]["files"]:
                    replacement = output if path.startswith("/logs/") else root / path.removeprefix("/")
                    if replacement != output:
                        replacement.parent.mkdir(parents=True, exist_ok=True)
                        replacement.write_text("Task evidence")
                    rubric = rubric.replace(path, str(replacement))
                (tests / "judge.toml").write_text(rubric)
                response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
                    content=json.dumps({criterion["name"]: {"score": True, "reasoning": "test response"}
                                        for criterion in tomllib.loads(rubric)["criterion"]})))])
                with patch.object(litellm, "acompletion", new_callable=AsyncMock, return_value=response) as api:
                    run(tests, workspace=root, output=root / "reward.json")
                    prompt = json.dumps(api.call_args.kwargs["messages"])
                    for value in ("completion-session", "check-1", "node tools/check.mjs", "Cache smoke check passed", "exit_code"):
                        self.assertIn(value, prompt)
                    self.assertNotIn("PRIVATE_REASONING", prompt)
                # Missing native evidence must invalidate the projection, not reuse it.
                transcript.unlink()
                with self.assertRaises(FileNotFoundError):
                    projection.collect(transcript, output)
                self.assertFalse(output.exists())

    def test_task_verifier_errors_are_unscored_and_task_failures_remain_scored(self):
        task = HERE.parent / "tasks/implement-checkout"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            tests = root / "tests"
            shutil.copytree(task / "environment/workspace", work)
            shutil.copytree(task / "tests", tests)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
            env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
            output = root / "logs/reward.json"
            with patch.dict(os.environ, env):
                # The nop workspace violates business assertions, not verifier availability.
                self.assertEqual(grade.grade(tests, work, output), {"reward": 0.0})
                subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ, check=True, capture_output=True)
                self.assertEqual(grade.grade(tests, work, output), {"reward": 1.0})
                contract = tests / "contracts.mjs"
                original_contract = contract.read_bytes()
                for defect in ("missing", "syntax"):
                    with self.subTest(verifier_resource=defect):
                        if defect == "missing":
                            contract.unlink()
                        else:
                            contract.write_text("export const =")
                        with self.assertRaises(RuntimeError):
                            grade.grade(tests, work, output)
                        self.assertFalse(output.exists())
                        self.assertTrue(json.loads((root / "logs/evaluation-status.json").read_text())["errors"])
                        contract.write_bytes(original_contract)
                original_baseline = baseline.read_bytes()
                baseline.unlink()
                with self.assertRaises(RuntimeError):
                    grade.grade(tests, work, output)
                self.assertFalse(output.exists())
                self.assertIn("FileNotFoundError", (root / "logs/check.log").read_text())
                baseline.write_bytes(original_baseline)
                assertion = tests / ".support/check.py"
                assertion.write_text("raise RuntimeError('broken verifier')")
                with self.assertRaises(RuntimeError):
                    grade.grade(tests, work, output)
                self.assertFalse(output.exists())
                self.assertIn("broken verifier", (root / "logs/check.log").read_text())
                assertion.unlink()
                # A semantic pass cannot replace an omitted private verifier.
                (tests / "judge.toml").write_text(
                    '[judge]'+chr(10)+'judge="openai/test-model"'+chr(10)+
                    '[[criterion]]'+chr(10)+'type="binary"'+chr(10)+'description="Task is correct"'+chr(10)
                )
                from types import SimpleNamespace
                import litellm
                response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
                    content=json.dumps({"score": True, "reasoning": "test response"})))])
                with patch.dict(os.environ, {"RSP_EVAL_OFFLINE": "0"}), patch.object(
                        litellm, "acompletion", new_callable=AsyncMock, return_value=response):
                    with self.assertRaises(RuntimeError):
                        grade.grade(tests, work, output)
                self.assertFalse(output.exists())
                self.assertIn("FileNotFoundError", (root / "logs/check.log").read_text())
                # Missing agent-owned output remains a graded task failure.
                assertion.write_text("from support import *; text('missing-report.json')")
                self.assertEqual(grade.grade(tests, work, output), {"reward": 0.0})

    def test_invalid_agent_report_shapes_are_scored_failures(self):
        for name in ("owner-decision", "structural-audit", "verify-boundary", "finding-investigation"):
            task = HERE.parent / "tasks" / name
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                work = root / "app"
                shutil.copytree(task / "environment/workspace", work)
                baseline = root / "baseline.json"
                subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
                env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "1"}
                with patch.dict(os.environ, env):
                    subprocess.run(["bash", str(task / "solution/solve.sh")], env=os.environ, check=True, capture_output=True)
                    report = work / "report.json"
                    original = json.loads(report.read_text())
                    field, value = {"owner-decision": ("currentCheck", []),
                                    "structural-audit": ("findings", [None]),
                                    "verify-boundary": ("checks", [None]),
                                    "finding-investigation": ("dispositions", [{"id": []}])}[name]
                    malformed = {**original, field: value}
                    for content in ("[]", "null", "{", json.dumps(malformed)):
                        with self.subTest(report=content):
                            report.write_text(content)
                            output = root / "logs/reward.json"
                            self.assertEqual(grade.grade(task / "tests", work, output), {"reward": 0.0})
                            self.assertEqual(json.loads((root / "logs/evaluation-status.json").read_text())["errors"], [])

    def test_structural_audit_accepts_equivalent_examples_and_rejects_false_claims(self):
        task = HERE.parent / "tasks/structural-audit"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            shutil.copytree(task / "environment/workspace", work)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
            env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline)}
            subprocess.run(["bash", str(task / "solution/solve.sh")], env=env, check=True, capture_output=True)
            report = work / "report.json"
            data = json.loads(report.read_text())
            command = ["python3", "-B", str(HERE / "verifier.py"), str(task / "tests/.support/check.py")]
            for example, expected in (({"input": 2.349, "expectedCents": 235, "actualCents": 234}, 0),
                                      ({"input": 2.349, "expectedCents": 235, "actualCents": 233}, 1),
                                      ({"input": 2, "expectedCents": 200, "actualCents": 200}, 1)):
                data["findings"][0]["example"] = example
                report.write_text(json.dumps(data))
                result = subprocess.run(command, env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)

    def test_child_tool_evidence_reaches_the_rewardkit_judge_with_session_identity(self):
        from types import SimpleNamespace
        import litellm
        from rewardkit.runner import run
        projection = load("session_evidence", HERE.parent / "tasks/native-coordination/tests/.support/session_evidence.py")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sessions = root / "sessions"
            sessions.mkdir()
            for identity, command in (("implementer", "apply_patch source"), ("reviewer", "node tools/check.mjs")):
                events = [
                    {"type": "session_meta", "payload": {"id": identity, "source": {"subagent": {"parent_thread_id": "parent"}}}},
                    {"type": "response_item", "timestamp": "2026-10-08T00:00:00Z", "payload": {"type": "function_call", "name": "exec_command", "call_id": identity + "-call", "arguments": command}},
                    {"type": "response_item", "timestamp": "2026-10-08T00:00:01Z", "payload": {"type": "function_call_output", "call_id": identity + "-call", "output": "exit_code=0; checks passed"}},
                ]
                (sessions / (identity + ".jsonl")).write_text("\n".join(json.dumps(e) for e in events))
            output = root / "child-sessions.jsonl"
            projection.collect(sessions, output)
            tests = root / "tests"
            tests.mkdir()
            rubric = (HERE.parent / "tasks/native-coordination/tests/judge.toml").read_text()
            # Use the production rubric with temporary absolute artifact paths.
            for original, replacement in (("/logs/verifier/child-sessions.jsonl", str(output)),
                                          ("/logs/agent/codex.txt", str(root / "parent.txt")),
                                          ("/app/src/pricing.mjs", str(root / "pricing.mjs")),
                                          ("/app/src/checkout.mjs", str(root / "checkout.mjs"))):
                rubric = rubric.replace(original, replacement)
            for name in ("parent.txt", "pricing.mjs", "checkout.mjs"):
                (root / name).write_text("Parent/production evidence")
            (tests / "judge.toml").write_text(rubric)
            async def completion(**kwargs):
                content = json.dumps({"score": True, "reasoning": "test response"})
                return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

            with patch.object(litellm, "acompletion", new_callable=AsyncMock, side_effect=completion) as api:
                run(tests, workspace=root, output=root / "reward.json")
                prompt = json.dumps(api.call_args.kwargs["messages"])
                for value in ("implementer", "reviewer", "reviewer-call", "node tools/check.mjs", "exit_code=0; checks passed"):
                    self.assertIn(value, prompt)
            # A completion claim without reviewer tools cannot supply evidence.
            (sessions / "reviewer.jsonl").write_text(json.dumps({"type": "session_meta", "payload": {"id": "reviewer", "source": {"subagent": {}}}}))
            with self.assertRaisesRegex(ValueError, "call/result pair"):
                projection.collect(sessions, output)
            self.assertFalse(output.exists())

    def test_staged_review_judge_receives_head_index_and_diff_instead_of_working_source(self):
        from types import SimpleNamespace
        import litellm
        task = HERE.parent / "tasks/review-staged"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work = root / "app"
            tests = root / "tests"
            shutil.copytree(task / "environment/workspace", work)
            shutil.copytree(task / "tests", tests)
            baseline = root / "baseline.json"
            subprocess.run(["python3", str(task / "environment/setup.py"), str(work), str(baseline)], check=True, capture_output=True)
            env = {"RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "RSP_LOG_DIR": str(root / "logs"), "RSP_EVAL_OFFLINE": "0"}
            with patch.dict(os.environ, env):
                subprocess.run(["bash", str(task / "solution/solve.sh")], check=True, env=os.environ, capture_output=True)
                command = ["python3", str(tests / ".support/staged_evidence.py")]
                subprocess.run(command, check=True, env=os.environ, capture_output=True)
                evidence = root / "logs/staged-review.md"
                report = work / "report.json"
                rubric = (tests / "judge.toml").read_text().replace("/app/report.json", str(report))
                rubric = rubric.replace("/logs/verifier/staged-review.md", str(evidence))
                (tests / "judge.toml").write_text(rubric)
                response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
                    content=json.dumps({"score": True, "reasoning": "test response"})))])
                with patch.object(litellm, "acompletion", new_callable=AsyncMock, return_value=response) as api:
                    self.assertEqual(grade.grade(tests, work, root / "logs/reward.json"), {"reward": 1.0})
                    messages = api.call_args.kwargs["messages"]
                    prompt = json.dumps(messages)
                    for value in ("HEAD", "Index", "HEAD to index diff", "1: /** Returns the discount amount. */",
                                  "2: export function discount(price, rate) { return price * rate }"):
                        self.assertIn(value, prompt)
                    self.assertNotIn("/** Returns the final payable price. */", prompt)
                # Regeneration fails closed instead of reusing old evidence.
                subprocess.run(["git", "update-index", "--force-remove", "src/discount.mjs"], cwd=work, check=True, capture_output=True)
                self.assertNotEqual(subprocess.run(command, env=os.environ, capture_output=True).returncode, 0)
                self.assertFalse(evidence.exists())

    def test_calibration_cli_selects_exact_samples_and_matching_snapshots(self):
        from harbor.models.job.config import JobConfig
        wanted = {"review-staged--missed-finding", "structural-audit-control--reference"}
        cases = [
            (["--sample", name] for name in sorted(wanted)),
            [["--task", "doc-export"], ["--task", "review-staged"], ["--task", "structural-audit-control"],
             ["--sample", "review-staged--missed-finding"], ["--sample", "structural-audit-control--reference"],
             ["--sample", "review-staged--missed-finding"]],
            [["--task", "review-staged"]],
            [],
        ]
        original_output = subprocess.check_output
        for index, options in enumerate(cases):
            with self.subTest(case=index), tempfile.TemporaryDirectory() as directory:
                home = Path(directory)
                for name in ("support", "jobs", "calibration", "tasks/doc-export", "tasks/review-staged", "tasks/structural-audit-control"):
                    shutil.copytree(HERE.parent / name, home / name)
                shutil.copy2(HERE.parent / "uv.lock", home / "uv.lock")
                owners = ["doc-export", "review-staged", "structural-audit-control"] if index == 3 else ["review-staged"]
                expected = wanted if index < 2 else {f"{owner}--{p.parent.name}" for owner in owners for p in (home / "calibration" / owner).glob("*/expected.json")}
                calls = []

                def output(command, **kwargs):
                    if command[:3] == ["docker", "image", "inspect"]:
                        return "test-image linux/arm64"
                    return original_output(command, **kwargs)

                def native(command, **kwargs):
                    config_path = Path(command[-1])
                    config = json.loads(config_path.read_text())
                    JobConfig.model_validate(config)
                    calls.append(config)
                    self.assertEqual(kwargs["env"]["RSP_EVAL_OFFLINE"], "0")
                    self.assertEqual(config["retry"], {"max_retries": 0})
                    self.assertEqual(config["n_attempts"], 1)
                    self.assertEqual(config["agents"], [{"name": "oracle"}])
                    inputs = config_path.parent
                    metadata = json.loads((inputs / "calibration.json").read_text())
                    paths = [Path(t["path"]) for t in config["tasks"]]
                    self.assertEqual(len(paths), len(expected))
                    self.assertEqual({p.name for p in paths}, expected)
                    self.assertEqual(set(metadata), expected)
                    self.assertEqual({p.name for p in (inputs / "samples").iterdir()}, expected)
                    owners = {case["task"] for case in metadata.values()}
                    self.assertEqual({p.name for p in (inputs / "tasks").iterdir()}, owners)
                    self.assertEqual(set(json.loads((inputs / "source.json").read_text())["tasks"]), owners)
                    job = Path(config["jobs_dir"]) / config["job_name"]
                    for path in paths:
                        self.assertEqual(path.parent, inputs / "samples")
                        case = metadata[path.name]
                        task = home / "tasks" / case["task"]
                        for source in task.rglob("*"):
                            if source.is_file():
                                self.assertEqual((inputs / "tasks" / case["task"] / source.relative_to(task)).read_bytes(), source.read_bytes())
                        sample = home / "calibration" / case["task"] / path.name.removeprefix(case["task"] + "--")
                        self.assertEqual(case, {**json.loads((sample / "expected.json").read_text()), "task": case["task"]})
                        self.assertEqual(case["label_status"], "candidate")
                        self.assertEqual((path / "solution/sample.sh").read_bytes(), (sample / "sample.sh").read_bytes())
                        self.assertEqual((path / "solution/base.sh").read_bytes(), (task / "solution/solve.sh").read_bytes())
                        for source in (task / "tests").rglob("*"):
                            if source.is_file():
                                self.assertEqual((path / source.relative_to(task)).read_bytes(), source.read_bytes())
                        trial = job / path.name
                        (trial / "verifier").mkdir(parents=True)
                        components = [{"name": key, "detail": {"kind": "programmatic" if key == "checks" else "llm", "score": value}}
                                      for key, value in case["expected"].items()]
                        (trial / "verifier/reward-details.json").write_text(json.dumps({"reward": {"kind": "group", "components": components}}))
                        (trial / "result.json").write_text(json.dumps({"task_name": path.name, "agent_info": {"name": "oracle"},
                                                                      "verifier_result": {"rewards": {"reward": 0}}}))
                    return 0

                argv = ["evaluate.py", "calibrate", "--allow-live", *[arg for pair in options for arg in pair]]
                with (patch.object(evaluate, "HOME", home), patch.object(evaluate, "check_image_inputs"),
                      patch.dict(os.environ, {"RSP_EVAL_OFFLINE": "0"}), patch("sys.argv", argv),
                      patch.object(subprocess, "check_output", side_effect=output),
                      patch.object(subprocess, "call", side_effect=native)):
                    self.assertEqual(evaluate.main(), 0)
                self.assertEqual(len(calls), 1)

    def test_calibration_cli_rejects_invalid_samples_and_missing_live_authority_before_jobs(self):
        cases = [
            (["--sample", "review-staged--absent", "--allow-live"], "0", "Unknown calibration samples"),
            (["--sample", "review-staged--reference", "--sample", "review-staged--absent", "--allow-live"], "0", "Unknown calibration samples"),
            (["--task", "doc-export", "--sample", "review-staged--reference", "--allow-live"], "0", "Unknown calibration samples"),
            (["--sample", "review-staged--reference"], "0", "requires --allow-live"),
            (["--sample", "review-staged--reference", "--allow-live"], "1", "Offline calibration"),
        ]
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            for name in ("jobs", "calibration", "tasks/doc-export", "tasks/review-staged"):
                shutil.copytree(HERE.parent / name, home / name)
            for options, offline, message in cases:
                with (self.subTest(options=options, offline=offline), patch.object(evaluate, "HOME", home),
                      patch.dict(os.environ, {"RSP_EVAL_OFFLINE": offline}),
                      patch("sys.argv", ["evaluate.py", "calibrate", *options]),
                      patch.object(subprocess, "call", side_effect=AssertionError("Unexpected Harbor execution")) as native):
                    with self.assertRaisesRegex(ValueError, message):
                        evaluate.main()
                    native.assert_not_called()
                    self.assertFalse((home / "reports").exists())

    def test_judge_calibration_uses_native_oracle_without_disabling_semantic_grading(self):
        from harbor.models.job.config import JobConfig
        original_output = subprocess.check_output
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            for name in ("support", "jobs", "calibration/doc-export", "tasks/doc-export"):
                shutil.copytree(HERE.parent / name, home / name)
            shutil.copy2(HERE.parent / "uv.lock", home / "uv.lock")
            jobs = []
            def output(command, **kwargs):
                if command[:3] == ["docker", "image", "inspect"]:
                    return "test-image linux/arm64"
                return original_output(command, **kwargs)
            def native(command, **kwargs):
                self.assertEqual(kwargs["env"]["RSP_EVAL_OFFLINE"], "0")
                config_path = Path(command[-1])
                config = json.loads(config_path.read_text())
                JobConfig.model_validate(config)
                if not config.get("source_jobs"):
                    self.assertEqual(config["agents"], [{"name": "oracle"}])
                job = Path(config["jobs_dir"]) / config["job_name"]
                jobs.append(job)
                (job / "config.json").write_text(json.dumps(config))
                expected = json.loads((config_path.parent / "calibration.json").read_text())
                for task in config["tasks"]:
                    path = Path(task["path"])
                    self.assertEqual((path / "tests/judge.toml").read_bytes(), (home / "tasks/doc-export/tests/judge.toml").read_bytes())
                    self.assertTrue((path / "solution/base.sh").is_file())
                    self.assertIn("/solution/sample.sh", (path / "solution/solve.sh").read_text())
                    trial = job / path.name
                    (trial / "verifier").mkdir(parents=True)
                    case = expected[path.name]
                    components = [{"name": key, "detail": {"kind": "programmatic" if key == "checks" else "llm", "score": value}}
                                  for key, value in case["expected"].items()]
                    (trial / "verifier/reward-details.json").write_text(json.dumps({"reward": {"kind": "group", "score": 0.5, "components": components}}))
                    trial_config = {"source_trial": {"action": "regrade", "type": "local", "path": str(jobs[0] / path.name)}} if config.get("source_jobs") else {}
                    (trial / "result.json").write_text(json.dumps({"task_name": path.name, "agent_info": {"name": "oracle"}, "config": trial_config,
                         "verifier_result": {"rewards": {"reward": 0.5}}}))
                return 0
            args = argparse_namespace(task=["doc-export"], sample=[], allow_live=True, attempts=1, concurrency=1)
            with (patch.object(evaluate, "HOME", home), patch.dict(os.environ, {"RSP_EVAL_OFFLINE": "0"}),
                  patch.object(evaluate, "check_image_inputs"),
                  patch.object(subprocess, "check_output", side_effect=output),
                  patch.object(subprocess, "call", side_effect=native)):
                self.assertEqual(evaluate.calibrate(args), 0)
                rubric = home / "tasks/doc-export/tests/judge.toml"
                rubric.write_text(rubric.read_text() + "\n# corrected grader snapshot\n")
                self.assertEqual(evaluate.regrade(argparse_namespace(job=jobs[0], allow_live=True, concurrency=1)), 0)
                self.assertEqual((jobs[0].with_name(jobs[0].name + ".inputs") / "calibration.json").read_bytes(),
                                 (jobs[1].with_name(jobs[1].name + ".inputs") / "calibration.json").read_bytes())
            job = jobs[1]
            summary = (job / "summary.md").read_text()
            self.assertIn("judge-calibration-regrade-match", summary)
            self.assertIn("candidate", summary)
            self.assertIn("not Skill acceptance or human validation", summary)
            with patch.dict(os.environ, {"RSP_EVAL_OFFLINE": "0"}):
                with self.assertRaisesRegex(ValueError, "requires --allow-live"):
                    evaluate.resume(argparse_namespace(job=job, allow_live=False, error_type=["RuntimeError"]))
            trial = next(p for p in job.iterdir() if p.is_dir())
            details = trial / "verifier/reward-details.json"
            data = json.loads(details.read_text())
            data["reward"]["components"][1]["detail"]["score"] = 1 - data["reward"]["components"][1]["detail"]["score"]
            details.write_text(json.dumps(data))
            self.assertEqual(evaluate.report(job)["judge-calibration-regrade-mismatch"], 1)
            self.assertEqual(evaluate.exit_status(job, evaluate.report(job)), 1)
            details.unlink()
            self.assertEqual(evaluate.report(job)["unscored"], 1)

    def test_report_exposes_failures_configuration_and_observed_duration(self):
        with tempfile.TemporaryDirectory() as directory:
            job = Path(directory)
            trial = job / "attempt"
            (trial / "verifier").mkdir(parents=True)
            (trial / "result.json").write_text(json.dumps({
                "task_name": "example", "started_at": "2026-10-08T01:00:00Z", "finished_at": "2026-10-08T01:00:12Z",
                "config": {"agent": {"model_name": "executor", "skills": ["/captured/rsp-doc"], "kwargs": {"reasoning_effort": "medium"}}},
                "verifier_result": {"rewards": {"reward": 0}},
            }))
            (trial / "verifier/reward-details.json").write_text(json.dumps({"judge": {
                "kind": "llm", "score": 0, "judge": {"model": "reviewer", "reasoning_effort": "high", "samples": 1},
                "criteria": [{"name": "grounded-claims", "value": 0, "reasoning": "See retained evidence"}]
            }}))
            evaluate.report(job)
            summary = (job / "summary.md").read_text()
            for value in ("failed 1/1", "executor", "medium", "rsp-doc", "reviewer", "high", "grounded-claims", "12.0", "reward-details.json"):
                self.assertIn(value, summary)
            (job / "result.json").write_text('{"n_total_trials":2}')
            counts = evaluate.report(job)
            self.assertEqual(counts["incomplete"], 1)
            summary = (job / "summary.md").read_text()
            self.assertIn("1 returned records", summary)
            self.assertIn("cannot establish the full-run success rate", summary)
            self.assertEqual(evaluate.exit_status(job, counts), 1)

    def test_report_distinguishes_unscorable_diagnostics_from_low_scores(self):
        root_error = "Could not parse JSON from judge response: invalid-format-3"
        summary_error = "unhandled errors in a TaskGroup (1 sub-exception)"
        for scenario, score, expected, exit_code in (
            ("valid-low", 0.5, "calibration-fail", 1),
            ("format-then-success", 1.0, "calibration-pass", 0),
            ("format-exhausted", None, "unscored", 1),
            ("timeout", None, "unscored", 1),
        ):
            with self.subTest(scenario=scenario), tempfile.TemporaryDirectory() as directory:
                job = Path(directory)
                trial = job / "trial"
                logs = trial / "verifier"
                logs.mkdir(parents=True)
                result = {"task_name": scenario, "agent_info": {"name": "oracle"},
                          "config": {}, "verifier_result": {"rewards": {"reward": score}}}
                criterion = {"name": "candidate-acceptance-boundary", "value": 1 if score == 1 else 0}
                details = {"judge": {"kind": "llm", "criteria": [criterion]}}
                if score is None:
                    result["verifier_result"] = None
                    result["exception_info"] = {"exception_type": "RewardFileNotFoundError"}
                if scenario == "format-exhausted":
                    details = {"error": summary_error, "root_causes": [{
                        "type": "builtins.ValueError", "message": root_error,
                        "location": {"file": "/opt/judges.py", "line": 320,
                                     "function": "parse_judge_response"}}]}
                elif scenario == "timeout":
                    criterion.update(raw=None, error="judge timed out after 300s")
                (trial / "result.json").write_text(json.dumps(result))
                (logs / "reward-details.json").write_text(json.dumps(details))
                retained = {p: p.read_bytes() for p in job.rglob("*") if p.is_file()}
                before_verdict = evaluate.verdict(trial, result)
                counts = evaluate.report(job)
                self.assertEqual(counts, {expected: 1})
                self.assertEqual(evaluate.exit_status(job, counts), exit_code)
                self.assertEqual(evaluate.verdict(trial, result), before_verdict)
                self.assertEqual({p: p.read_bytes() for p in retained}, retained)
                rendered = (job / "summary.md").read_text()
                self.assertIn("Grading details", rendered)
                if scenario == "valid-low":
                    self.assertIn("Unsatisfied criteria (judge)", rendered)
                    self.assertNotIn("Unscorable criterion", rendered)
                elif scenario == "timeout":
                    self.assertIn("Unscorable criterion (judge)", rendered)
                    self.assertIn("judge timed out after 300s", rendered)
                    self.assertNotIn("Unsatisfied criteria", rendered)
                elif scenario == "format-exhausted":
                    for text in (summary_error, root_error, "builtins.ValueError", "/opt/judges.py:320"):
                        self.assertIn(text, rendered)
                    self.assertNotIn("Unsatisfied criteria", rendered)
                else:
                    for text in ("Unscorable", "Unsatisfied", "Root cause", "Grading unavailable"):
                        self.assertNotIn(text, rendered)

    def test_report_keeps_native_results_when_grading_details_cannot_be_read(self):
        for calibration in (False, True):
            for mode in ("normal", "missing", "invalid-json", "read-denied"):
                with self.subTest(calibration=calibration, mode=mode), tempfile.TemporaryDirectory() as directory:
                    job = Path(directory) / "job"
                    for name in ("target", "peer"):
                        trial = job / name
                        score = 0.5 if name == "target" and not calibration else 1
                        (trial / "verifier").mkdir(parents=True)
                        (trial / "result.json").write_text(json.dumps({
                            "task_name": name, "agent_info": {"name": "oracle" if calibration else "codex"},
                            "config": {}, "verifier_result": {"rewards": {"reward": score}}}))
                        (trial / "verifier/reward-details.json").write_text(json.dumps({
                            "reward": {"kind": "group", "score": score, "components": [
                                {"name": component, "detail": {"kind": "programmatic", "score": 0 if score < 1 and component == "judge" else 1}}
                                for component in ("checks", "judge")]}}))
                    if calibration:
                        inputs = job.with_name("job.inputs")
                        inputs.mkdir()
                        (inputs / "calibration.json").write_text(json.dumps({name: {
                            "label_status": "candidate", "expected": {"checks": 1, "judge": 1}}
                            for name in ("target", "peer")}))
                    target = job / "target/verifier/reward-details.json"
                    if mode == "missing":
                        target.unlink()
                    elif mode == "invalid-json":
                        target.write_text('{"reward":')
                    before = {p: p.read_bytes() for p in Path(directory).rglob("*") if p.is_file()}
                    original_read = Path.read_text
                    hits = []

                    def read(path, *args, **kwargs):
                        if mode == "read-denied" and path == target:
                            hits.append(path)
                            raise PermissionError("Injected grading-details read refusal")
                        return original_read(path, *args, **kwargs)

                    with patch.object(Path, "read_text", read):
                        counts = evaluate.report(job)
                        code = evaluate.exit_status(job, counts)
                    if mode == "read-denied":
                        self.assertTrue(hits)
                    affected = calibration and mode != "normal"
                    ordinary = "judge-calibration-match" if calibration else "passed"
                    target_verdict = "unscored" if affected else ordinary if calibration else "failed"
                    expected_counts = {ordinary: 2} if target_verdict == ordinary else {ordinary: 1, target_verdict: 1}
                    self.assertEqual(counts, expected_counts)
                    self.assertEqual(code, 1 if affected or not calibration else 0)
                    self.assertEqual({p: p.read_bytes() for p in before}, before)
                    summary = (job / "summary.md").read_text()
                    self.assertIn(f"| peer | {ordinary} |", summary)
                    self.assertIn(f"| target | {target_verdict} |", summary)
                    if mode in ("invalid-json", "read-denied"):
                        error_type = "JSONDecodeError" if mode == "invalid-json" else "PermissionError"
                        self.assertIn("Grading details unavailable: " + error_type, summary)
                        self.assertIn("Native result retained", summary)
                    else:
                        self.assertNotIn("Grading details unavailable", summary)

    def test_comparison_preserves_current_and_peer_when_baseline_trial_is_unreadable(self):
        for mode in ("normal", "missing", "invalid-json", "read-denied"):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                current, baseline = root / "current", root / "baseline"
                for job in (current, baseline):
                    job.mkdir()
                    (job / "result.json").write_text('{"n_total_trials":2}')
                    for name, folder in (("target", "opaque-id"), ("peer", "other-id")):
                        trial = job / folder
                        trial.mkdir()
                        (trial / "result.json").write_text(json.dumps({
                            "task_name": name, "task_checksum": "saved-" + name,
                            "config": {"agent": {"name": "codex", "model_name": "fixed"}},
                            "verifier_result": {"rewards": {"reward": 1}}}))
                target = baseline / "opaque-id/result.json"
                if mode == "missing":
                    target.unlink()
                elif mode == "invalid-json":
                    target.write_text('{"task_name":')
                before = {p: p.read_bytes() for p in root.rglob("*") if p.is_file()}
                original_read = Path.read_text

                def read(path, *args, **kwargs):
                    if mode == "read-denied" and path == target:
                        raise PermissionError("Injected baseline trial result read refusal")
                    return original_read(path, *args, **kwargs)

                with patch.object(Path, "read_text", read):
                    counts = evaluate.report(current, baseline)
                    self.assertEqual(counts, {"passed": 2})
                    self.assertEqual(evaluate.exit_status(current, counts), 0)
                self.assertEqual({p: p.read_bytes() for p in before}, before)
                summary = (current / "summary.md").read_text()
                for name in ("target", "peer"):
                    self.assertIn(f"| {name} | passed |", summary)
                self.assertIn("- peer: {'passed': 1} → {'passed': 1}", summary)
                if mode in ("invalid-json", "read-denied"):
                    self.assertIn("- target: unavailable → {'passed': 1}", summary)
                    self.assertIn("Unreadable baseline trial results", summary)
                    self.assertIn("opaque-id/result.json", summary)
                    self.assertIn("JSONDecodeError" if mode == "invalid-json" else "PermissionError", summary)
                    self.assertIn("per-task coverage unavailable", summary)
                    self.assertIn("must not be interpreted as improvement", summary)
                    self.assertIn("classification exit status do not establish baseline completeness", summary)
                    self.assertNotIn("Recorded task checksum and agent model/settings match", summary)
                else:
                    self.assertNotIn("Unreadable baseline trial results", summary)
                    label = "missing" if mode == "missing" else "{'passed': 1}"
                    self.assertIn(f"- target: {label} → {{'passed': 1}}", summary)
                    if mode == "missing":
                        self.assertIn("task_checksum unavailable", summary)

    def test_report_keeps_peer_when_execution_status_cannot_be_read(self):
        cases = [("codex", mode) for mode in ("normal", "missing", "invalid-json", "read-denied")]
        cases += [("oracle", "normal"), ("nop", "normal")]
        for agent_name, mode in cases:
            with self.subTest(agent=agent_name, mode=mode), tempfile.TemporaryDirectory() as directory:
                job = Path(directory)
                (job / "result.json").write_text('{"n_total_trials":2}')
                for name in ("target", "peer"):
                    trial = job / name
                    (trial / "verifier").mkdir(parents=True)
                    (trial / "result.json").write_text(json.dumps({
                        "task_name": name, "config": {}, "agent_info": {"name": agent_name},
                        "verifier_result": {"rewards": {"reward": int(agent_name != "nop")}}}))
                    (trial / "verifier/evaluation-status.json").write_text('{"semantic":"task-defined"}')
                target = job / "target/verifier/evaluation-status.json"
                if mode == "missing":
                    target.unlink()
                elif mode == "invalid-json":
                    target.write_text('{"semantic":')
                before = {p: p.read_bytes() for p in job.rglob("*") if p.is_file()}
                original_read = Path.read_text

                def read(path, *args, **kwargs):
                    if mode == "read-denied" and path == target:
                        raise PermissionError("Injected evaluation-status read refusal")
                    return original_read(path, *args, **kwargs)

                affected = mode in ("invalid-json", "read-denied")
                ordinary = {"codex": "passed", "oracle": "calibration-pass", "nop": "calibration-fail"}[agent_name]
                with patch.object(Path, "read_text", read):
                    counts = evaluate.report(job)
                    self.assertEqual(counts, {ordinary: 1, "unscored": 1} if affected else {ordinary: 2})
                    self.assertEqual(evaluate.exit_status(job, counts), int(affected))
                self.assertEqual({p: p.read_bytes() for p in before}, before)
                summary = (job / "summary.md").read_text()
                self.assertIn(f"| peer | {ordinary} |", summary)
                self.assertIn(f"| target | {'unscored' if affected else ordinary} |", summary)
                if affected:
                    self.assertIn("Execution mode unavailable", summary)
                    self.assertIn("target/verifier/evaluation-status.json", summary)
                    self.assertIn("JSONDecodeError" if mode == "invalid-json" else "PermissionError", summary)
                    self.assertIn("Native scores retained; trial is unscored", summary)
                else:
                    self.assertNotIn("Execution mode unavailable", summary)

    def test_report_preserves_calibration_identity_when_expectations_are_unavailable(self):
        cases = [("judge-calibration", mode) for mode in ("normal", "missing", "invalid-json", "read-denied")]
        cases += [("oracle", "missing"), ("nop", "missing")]
        for kind, mode in cases:
            with self.subTest(kind=kind, mode=mode), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                job, inputs = root / "job", root / "job.inputs"
                job.mkdir()
                inputs.mkdir()
                (job / "result.json").write_text('{"n_total_trials":2}')
                (inputs / "source.json").write_text(json.dumps({"agent": kind}))
                expectations = {}
                for name in ("positive", "negative"):
                    score = int(name == "positive") if kind == "judge-calibration" else int(kind == "oracle")
                    trial = job / name
                    (trial / "verifier").mkdir(parents=True)
                    (trial / "result.json").write_text(json.dumps({
                        "task_name": name, "agent_info": {"name": "nop" if kind == "nop" else "oracle"},
                        "config": {}, "verifier_result": {"rewards": {"reward": score}}}))
                    (trial / "verifier/reward-details.json").write_text(json.dumps({
                        "reward": {"kind": "group", "score": score, "components": [
                            {"name": key, "detail": {"kind": "programmatic", "score": score}}
                            for key in ("checks", "judge")]}}))
                    expectations[name] = {"label_status": "candidate", "expected": {"checks": score, "judge": score}}
                target = inputs / "calibration.json"
                if mode != "missing":
                    target.write_text('{"sample":' if mode == "invalid-json" else json.dumps(expectations))
                before = {p: p.read_bytes() for p in root.rglob("*") if p.is_file()}
                original_read = Path.read_text

                def read(path, *args, **kwargs):
                    if mode == "read-denied" and path == target:
                        raise PermissionError("Injected calibration manifest read refusal")
                    return original_read(path, *args, **kwargs)

                affected = kind == "judge-calibration" and mode != "normal"
                expected = "unscored" if affected else {"judge-calibration": "judge-calibration-match",
                           "oracle": "calibration-pass", "nop": "calibration-fail"}[kind]
                with patch.object(Path, "read_text", read):
                    counts = evaluate.report(job)
                    self.assertEqual(counts, {expected: 2})
                    self.assertEqual(evaluate.exit_status(job, counts), int(affected))
                self.assertEqual({p: p.read_bytes() for p in before}, before)
                summary = (job / "summary.md").read_text()
                for name in ("positive", "negative"):
                    self.assertIn(f"| {name} | {expected} |", summary)
                if affected:
                    self.assertIn("Calibration expectations unavailable", summary)
                    self.assertIn("no expected scores inferred", summary)
                    self.assertNotIn("expected components", summary)
                    error = {"missing": "FileNotFoundError", "invalid-json": "JSONDecodeError", "read-denied": "PermissionError"}[mode]
                    self.assertIn(error, summary)
                    if mode == "missing":
                        self.assertIn("source.json agent=judge-calibration", summary)
                else:
                    self.assertNotIn("Calibration expectations unavailable", summary)

    def test_report_keeps_trials_and_marks_unknown_job_plan(self):
        for mode in ("normal", "missing", "invalid-json", "read-denied"):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as directory:
                job = Path(directory)
                for name in ("first", "second"):
                    trial = job / name
                    trial.mkdir()
                    (trial / "result.json").write_text(json.dumps({
                        "task_name": name, "config": {},
                        "verifier_result": {"rewards": {"reward": 1}}}))
                target = job / "result.json"
                if mode != "missing":
                    target.write_text('{"n_total_trials":' if mode == "invalid-json" else '{"n_total_trials":2}')
                before = {p: p.read_bytes() for p in job.rglob("*") if p.is_file()}
                read_text = Path.read_text

                def read(path, *args, **kwargs):
                    if mode == "read-denied" and path == target:
                        raise PermissionError("Injected job result read refusal")
                    return read_text(path, *args, **kwargs)

                with patch.object(Path, "read_text", read):
                    counts = evaluate.report(job)
                    self.assertEqual(counts, {"passed": 2})
                    self.assertEqual(evaluate.exit_status(job, counts), 0)
                self.assertEqual({p: p.read_bytes() for p in before}, before)
                summary = (job / "summary.md").read_text()
                for name in ("first", "second"):
                    self.assertIn(f"| {name} | passed |", summary)
                if mode == "normal":
                    self.assertIn("Planned trials: 2 (from job result.json).", summary)
                    self.assertNotIn("Run completeness: unknown", summary)
                else:
                    self.assertIn("Planned trials: unknown. Run completeness: unknown.", summary)
                    self.assertIn("classification exit 0 does not confirm run completeness", summary)
                    self.assertIn("report command exit 0 only confirms report generation", summary)
                    self.assertNotIn("Planned trials: 2", summary)
                    error_type = {"missing": "FileNotFoundError", "invalid-json": "JSONDecodeError",
                                  "read-denied": "PermissionError"}[mode]
                    self.assertIn("result.json: " + error_type, summary)

    def test_report_preserves_peer_when_trial_result_is_unreadable(self):
        for mode in ("normal", "missing", "invalid-json", "read-denied"):
            for planned in (None, 2):
                with self.subTest(mode=mode, planned=planned), tempfile.TemporaryDirectory() as directory:
                    job = Path(directory)
                    for name in ("target", "peer"):
                        trial = job / name
                        trial.mkdir()
                        (trial / "result.json").write_text(json.dumps({
                            "task_name": name, "config": {},
                            "verifier_result": {"rewards": {"reward": 1}}}))
                    if planned is not None:
                        (job / "result.json").write_text(json.dumps({"n_total_trials": planned}))
                    target = job / "target/result.json"
                    if mode == "missing":
                        target.unlink()
                    elif mode == "invalid-json":
                        target.write_text('{"task_name":')
                    before = {p: p.read_bytes() for p in job.rglob("*") if p.is_file()}
                    original_read = Path.read_text

                    def read(path, *args, **kwargs):
                        if mode == "read-denied" and path == target:
                            raise PermissionError("Injected trial read refusal")
                        return original_read(path, *args, **kwargs)

                    with patch.object(Path, "read_text", read):
                        counts = evaluate.report(job)
                        code = evaluate.exit_status(job, counts)
                    incomplete = mode != "normal" and (planned is not None or mode != "missing")
                    expected = {"passed": 2 if mode == "normal" else 1}
                    if incomplete:
                        expected["incomplete"] = 1
                    self.assertEqual(counts, expected)
                    self.assertEqual(code, int(incomplete))
                    self.assertEqual({p: p.read_bytes() for p in before}, before)
                    summary = (job / "summary.md").read_text()
                    self.assertIn("| peer | passed |", summary)
                    if mode != "normal":
                        self.assertNotIn("| target |", summary)
                        self.assertNotIn("- target (", summary)
                    if mode in ("invalid-json", "read-denied"):
                        self.assertIn("## Unreadable trial results", summary)
                        self.assertIn("target/result.json", summary)
                        self.assertIn("JSONDecodeError" if mode == "invalid-json" else "PermissionError", summary)
                        self.assertIn("task identities and scores are unavailable", summary)
                    else:
                        self.assertNotIn("## Unreadable trial results", summary)

    def test_initial_image_drift_stops_before_job_creation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            home = root / "tests/skills"
            files = {}
            for name in ("bin/rsp.mjs", "dist/cli.mjs", "rules/rsp-rules.md", "skills/rsp/SKILL.md",
                         "package.json", "pnpm-lock.yaml"):
                files[f"/opt/rsp-package/{name}"] = root / name
            for name in ("grade", "checks", "verifier", "workspace", "outputs"):
                files[f"/opt/rsp-eval/{name}.py"] = home / f"support/{name}.py"
            files["/opt/rsp-build/uv.lock"] = home / "uv.lock"
            files["/opt/rsp-build/Dockerfile"] = home / "images/agent/Dockerfile"
            for path in files.values():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(path.name)
            baked = {key: hashlib.sha256(path.read_bytes()).hexdigest() for key, path in files.items()}
            with patch.object(evaluate, "ROOT", root), patch.object(evaluate, "HOME", home):
                with patch.object(subprocess, "check_output", return_value=json.dumps(baked)):
                    evaluate.check_image_inputs()
                for kind in ("changed", "missing", "extra"):
                    actual = dict(baked)
                    key = "/opt/rsp-eval/grade.py"
                    if kind == "changed":
                        actual[key] = "older-bytes"
                    elif kind == "missing":
                        del actual[key]
                    else:
                        actual["/opt/rsp-package/skills/retired/SKILL.md"] = "retired"
                    with self.subTest(kind=kind), patch.object(subprocess, "check_output", return_value=json.dumps(actual)):
                        with self.assertRaisesRegex(ValueError, "image input drift.*rebuild"):
                            evaluate.snapshot([], "oracle")
                        self.assertFalse((home / "reports").exists())

    def test_skill_selection_is_snapshotted_without_editing_default_job(self):
        for selection in ("default", "selected", "none"):
            with self.subTest(selection=selection), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                home, _ = resume_fixture(root)
                shutil.copytree(HERE.parent / "tasks/implement-checkout", home / "tasks/implement-checkout")
                (home / "jobs").mkdir()
                skill = root / "skills/example"
                skill.mkdir(parents=True)
                (skill / "SKILL.md").write_text("candidate bytes")
                config = {"agents": [{"name": "codex", "model_name": "test-model", "skills": ["skills/example"]}]}
                catalog = root / "models.json"
                selected_model = {"slug": "test-model", "truncation_policy": {"mode": "tokens", "limit": 10000}}
                catalog.write_text(json.dumps({"models": [selected_model, {"slug": "unrelated-model"}]}))
                config["agents"][0]["kwargs"] = {"config": {"model_catalog_json": str(catalog)}}
                default = home / "jobs/default.yaml"
                default.write_text(json.dumps(config))
                original = default.read_bytes()
                def consume(job, inputs, config):
                    evaluate.JobConfig.model_validate(config)
                    paths = config["agents"][0]["skills"]
                    captured = Path(config["agents"][0]["kwargs"]["config"]["model_catalog_json"])
                    self.assertTrue(captured.is_relative_to(inputs))
                    self.assertEqual(json.loads(captured.read_text()), {"models": [selected_model]})
                    catalog.unlink()
                    self.assertEqual(json.loads(captured.read_text()), {"models": [selected_model]})
                    self.assertEqual(len(paths), 0 if selection == "none" else 1)
                    for path in paths:
                        self.assertTrue(Path(path).is_relative_to(inputs))
                        self.assertEqual((Path(path) / "SKILL.md").read_text(), "candidate bytes")
                    return 0
                with patch.object(evaluate, "ROOT", root), patch.object(evaluate, "HOME", home), \
                        patch.dict(os.environ, {}, clear=True), patch.object(evaluate, "check_image_inputs"), \
                        patch.object(evaluate, "image_identity", return_value="image-v1"), \
                        patch.object(subprocess, "check_output", side_effect=["commit", b"patch"]), \
                        patch.object(evaluate, "execute", side_effect=consume):
                    args = argparse_namespace(task=[], agent="codex", allow_live=True, attempts=1, concurrency=1,
                                              skill=[str(skill)] if selection == "selected" else [],
                                              no_skills=selection == "none", model=None)
                    self.assertEqual(evaluate.run(args), 0)
                self.assertEqual(default.read_bytes(), original)

    def test_image_build_uses_installed_versions_not_version_ranges(self):
        builder = load("build_image", HERE.parent / "build_image.py")
        with patch.object(builder.subprocess, "check_output", side_effect=["v24.21.0\n", "12.9.1\n", "3.13.13\n"]):
            self.assertEqual(builder.resolved_versions(), {"node": "24.21.0", "pnpm": "12.9.1", "python": "3.13.13"})
        with patch.object(builder.subprocess, "check_output", return_value="24\n"):
            with self.assertRaisesRegex(ValueError, "installed release version"):
                builder.resolved_versions()


def resume_fixture(root):
    home = root / "home"
    (home / "support").mkdir(parents=True)
    (home / "support/agent.py").write_text("adapter-v1")
    (home / "uv.lock").write_text("lock-v1")
    job = root / "job"
    job.mkdir()
    (job / "config.json").write_text('{"agents":[{"name":"oracle"}]}')
    inputs = job.with_name(job.name + ".inputs")
    shutil.copytree(home, inputs)
    (inputs / "source.json").write_text('{"image":"image-v1"}')
    return home, job


def argparse_namespace(**kwargs):
    from argparse import Namespace
    return Namespace(**kwargs)


if __name__ == "__main__":
    unittest.main()
