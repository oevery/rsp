"""Regression coverage for the small RSP/Harbor integration boundary."""
import asyncio
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

from harbor.agents.installed.codex import Codex
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
                (job / "trial/result.json").write_text(json.dumps(result))
            evaluate.report(jobs[1], jobs[0])
            summary = (jobs[1] / "summary.md").read_text()
            self.assertIn("| unknown | 0 |", summary)
            self.assertNotIn("mismatch", summary)
            self.assertIn("skill paths are intentionally excluded", summary)
            result["task_checksum"] = "corrected-grader"
            result["config"]["agent"]["model_name"] = "model-b"
            (jobs[1] / "trial/result.json").write_text(json.dumps(result))
            evaluate.report(jobs[1], jobs[0])
            summary = (jobs[1] / "summary.md").read_text()
            self.assertIn("task_checksum mismatch", summary)
            self.assertIn("agent model/settings mismatch", summary)
            self.assertIn("must not be attributed to candidate improvement", summary)

    def test_routed_model_reaches_native_executor_unchanged(self):
        instance = object.__new__(agent.RoutedCodex)
        instance.model_name = "AI-HUB/gpt-6.1-sol"
        with patch.object(Codex, "exec_as_agent", new_callable=AsyncMock) as execute:
            asyncio.run(instance.exec_as_agent(None, "codex exec --model gpt-6.1-sol --json -- task"))
            self.assertIn("--model AI-HUB/gpt-6.1-sol ", execute.call_args.args[1])

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
                 "doc-export", "context-merge", "recovery-export", "workflow-catalog")
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
            args = argparse_namespace(task=["doc-export"], allow_live=True, attempts=1, concurrency=1)
            with (patch.object(evaluate, "HOME", home), patch.dict(os.environ, {"RSP_EVAL_OFFLINE": "0"}),
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
