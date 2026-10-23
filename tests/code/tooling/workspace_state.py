"""Offline initial-state ownership and preservation regressions."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
ROOT = Path(__file__).resolve().parents[3]
HOME = ROOT / "tests/skills"
sys.path.insert(0, str(HOME / "support"))
from workspace import capture_initial_state, preserve_notes, preserve_snapshot

spec = importlib.util.spec_from_file_location("evaluate", HOME / "evaluate.py")
evaluate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluate)
from native_resume_fixture import record_task_lock


def setup(task, directory):
    work, baseline = directory / "app", directory / "initial.json"
    shutil.copytree(task / "environment/workspace", work)
    subprocess.run([sys.executable, "-B", str(task / "environment/setup.py"), str(work), str(baseline)],
                   env={**os.environ, "RSP_FIXTURE_CLI": "node " + str(ROOT / "dist/cli.mjs")},
                   check=True, capture_output=True, text=True)
    return work, baseline


class WorkspaceState(unittest.TestCase):
    def execution_fixture(self, root, calibrated=False):
        job = root / "job"
        job.mkdir()
        inputs = root / "job.inputs"
        source = HOME / "tasks/commit-restraint"
        task = inputs / ("samples" if calibrated else "tasks") / (source.name + ("--reference" if calibrated else ""))
        shutil.copytree(source, task)
        work, baseline = setup(source, root)
        initial = json.loads(baseline.read_text())
        shutil.rmtree(task / "environment")
        shutil.move(work, task / "environment")
        image = "sha256:" + "a" * 64
        with patch.object(evaluate, "prepare_task_workspace", return_value=(image, initial)):
            evaluate.prepare_task_environment(task, runtime_image=image)
        shutil.copytree(HOME / "support", inputs / "support", ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copy2(HOME / "uv.lock", inputs / "uv.lock")
        (inputs / "source.json").write_text(json.dumps({"image": image}))
        config = {"job_name": job.name, "jobs_dir": str(root),
                  "agents": [{"name": "oracle"}], "tasks": [{"path": str(task)}],
                  "environment": {"type": "docker", "delete": True}}
        (job / "config.json").write_text(json.dumps(config))
        trial = job / "failed"
        trial.mkdir()
        (trial / "result.json").write_text(json.dumps({"task_name": task.name,
            "exception_info": {"exception_type": "RuntimeError"}}))
        (trial / "trace.txt").write_text("Retain this failed attempt.\n")
        record_task_lock(trial, task)
        return job, inputs, task, config

    def test_execution_and_resume_check_uploaded_modes_before_dispatch_or_backup(self):
        for action in ("execute", "resume"):
            for calibrated in (False, True):
                for state in ("unchanged", "mode-drift", "missing-modes", "legacy-image"):
                    with self.subTest(action=action, calibrated=calibrated, state=state), tempfile.TemporaryDirectory() as directory:
                        job, inputs, task, config = self.execution_fixture(Path(directory), calibrated)
                        note = task / "environment/user-notes.txt"
                        baseline = task / "tests/baseline.json"
                        digest = evaluate.Packager.compute_content_hash(task)[0]
                        if state == "mode-drift":
                            note.chmod(0o755)
                            self.assertEqual(evaluate.Packager.compute_content_hash(task)[0], digest)
                        elif state == "missing-modes":
                            initial = json.loads(baseline.read_text())
                            del initial["modes"]
                            baseline.write_text(json.dumps(initial))
                        elif state == "legacy-image":
                            (task / "environment/Dockerfile").write_text("FROM scratch\n")
                            baseline.unlink()
                        before = {p: p.read_bytes() for p in job.rglob("*") if p.is_file()}
                        initial_bytes = baseline.read_bytes() if baseline.exists() else None
                        with (patch.dict(os.environ),
                              patch.object(evaluate, "image_identity", return_value="sha256:" + "a" * 64),
                              patch.object(evaluate, "harbor", return_value=0) as native,
                              patch.object(evaluate, "report", return_value={"passed": 1}) as report):
                            def invoke():
                                if action == "execute":
                                    return evaluate.execute(job, inputs, config)
                                return evaluate.resume(SimpleNamespace(job=job, allow_live=False, error_type=["RuntimeError"]))
                            if state in ("mode-drift", "missing-modes"):
                                with self.assertRaisesRegex(ValueError, "mode drift|modes unavailable"):
                                    invoke()
                                native.assert_not_called()
                                report.assert_not_called()
                                self.assertFalse(job.with_name(job.name + ".attempts").exists())
                                self.assertFalse((inputs / "job.json").exists())
                                self.assertEqual({p: p.read_bytes() for p in job.rglob("*") if p.is_file()}, before)
                            else:
                                self.assertEqual(invoke(), 0)
                                native.assert_called_once()
                        self.assertEqual(baseline.read_bytes() if baseline.exists() else None, initial_bytes)
                        if state == "mode-drift":
                            self.assertEqual(note.stat().st_mode & 0o7777, 0o755)

    def test_regrade_execution_and_resume_do_not_check_unused_workspace_modes(self):
        for action in ("execute", "resume"):
            with self.subTest(action=action), tempfile.TemporaryDirectory() as directory:
                job, inputs, task, config = self.execution_fixture(Path(directory))
                del config["agents"]
                config["source_jobs"] = [{"action": "regrade", "type": "local", "path": str(job)}]
                (job / "config.json").write_text(json.dumps(config))
                (task / "environment/user-notes.txt").chmod(0o755)
                with (patch.object(evaluate, "prepare_environment"),
                      patch.object(evaluate, "image_identity", return_value="sha256:" + "a" * 64),
                      patch.object(evaluate, "harbor", return_value=0) as native,
                      patch.object(evaluate, "report", return_value={"passed": 1})):
                    if action == "execute":
                        self.assertEqual(evaluate.execute(job, inputs, config), 0)
                    else:
                        self.assertEqual(evaluate.resume(SimpleNamespace(job=job, allow_live=True, error_type=["RuntimeError"])), 0)
                    native.assert_called_once()

    def regrade_fixture(self, root, calibrated=False):
        home, job = root / "home", root / "source"
        job.mkdir()
        (job / "config.json").write_text('{}')
        task_name = "doc-export" if calibrated else "commit-prerequisite-success"
        for area in ("support", "jobs"):
            shutil.copytree(HOME / area, home / area, ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copy2(HOME / "uv.lock", home / "uv.lock")
        shutil.copytree(HOME / "tasks" / task_name, home / "tasks" / task_name)
        inputs = job.with_name(job.name + ".inputs")
        base = inputs / "tasks" / task_name
        shutil.copytree(HOME / "tasks" / task_name, base)
        state = {"head": "base-head", "index": "", "files": {"inspection.json": "a" * 64},
                 "environment_image": "sha256:" + "a" * 64}
        evaluate.prepare_task_environment(base, state)
        task = base
        if calibrated:
            task = inputs / "samples" / (task_name + "--reference")
            shutil.copytree(base, task)
            evaluate.prepare_task_environment(task, {**state, "head": "sample-head"})
            evaluate.use_oracle_evidence(task)
            (inputs / "calibration.json").write_text(json.dumps({task.name: {"task": task_name}}))
        trial = job / "trial"
        trial.mkdir()
        (trial / "result.json").write_text(json.dumps({"task_name": task.name}))
        record_task_lock(trial, task)
        return home, job, task, base, trial

    def test_regrade_rejects_changed_initial_state_before_creating_a_job(self):
        for calibrated in (False, True):
            with self.subTest(calibrated=calibrated), tempfile.TemporaryDirectory() as directory:
                home, job, task, _, _ = self.regrade_fixture(Path(directory), calibrated)
                baseline = task / "tests/baseline.json"
                state = json.loads(baseline.read_text())
                state["files"]["inspection.json"] = "0" * 64
                baseline.write_text(json.dumps(state))
                with (patch.object(evaluate, "HOME", home), patch.object(evaluate, "prepare_environment"),
                      patch.object(evaluate, "snapshot", side_effect=AssertionError("Unverified state reached preparation")) as snapshot,
                      patch.object(evaluate, "execute") as execute):
                    with self.assertRaisesRegex(ValueError, "Trusted execution initial state unavailable"):
                        evaluate.regrade(SimpleNamespace(job=job, allow_live=True, concurrency=1))
                    snapshot.assert_not_called()
                    execute.assert_not_called()

    def test_calibration_regrade_uses_locked_sample_not_unexecuted_base(self):
        with tempfile.TemporaryDirectory() as directory:
            home, job, task, base, _ = self.regrade_fixture(Path(directory), True)
            state = json.loads((task / "tests/baseline.json").read_text())
            peer = task.with_name("doc-export--alternative")
            shutil.copytree(task, peer)
            evaluate.prepare_task_environment(peer, {**state, "head": "peer-head"})
            manifest = job.with_name(job.name + ".inputs") / "calibration.json"
            cases = json.loads(manifest.read_text())
            cases[peer.name] = {"task": "doc-export"}
            manifest.write_text(json.dumps(cases))
            peer_trial = job / "peer"
            peer_trial.mkdir()
            (peer_trial / "result.json").write_text(json.dumps({"task_name": peer.name}))
            record_task_lock(peer_trial, peer)
            expected = {task.name: state, peer.name: {**state, "head": "peer-head"}}
            # The base is only a preparation template; it was never executed.
            (base / "tests/baseline.json").write_text('{broken')
            observed = []

            def execution(new_job, inputs, config):
                for definition in config["tasks"]:
                    selected = Path(definition["path"])
                    self.assertEqual(json.loads((selected / "tests/baseline.json").read_text()), expected[selected.name])
                    observed.append(selected.name)
                return 0

            with (patch.object(evaluate, "HOME", home), patch.object(evaluate, "prepare_environment"),
                  patch.object(evaluate, "check_image_inputs"),
                  patch.object(evaluate, "prepare_task_workspace", side_effect=AssertionError("Unexpected image build")),
                  patch.object(evaluate, "image_identity", return_value="offline-image"),
                  patch.object(evaluate, "execute", side_effect=execution)):
                self.assertEqual(evaluate.regrade(SimpleNamespace(job=job, allow_live=True, concurrency=1)), 0)
            self.assertEqual(set(observed), set(expected))

    def test_regrade_requires_every_source_lock_and_coverage_of_initial_state(self):
        for failure in ("missing", "malformed", "wrong-task", "ignored-baseline", "missing-baseline", "later-attempt"):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                home, job, task, _, trial = self.regrade_fixture(Path(directory))
                lock = trial / "lock.json"
                if failure == "missing":
                    lock.unlink()
                elif failure == "malformed":
                    lock.write_text('{broken')
                elif failure == "wrong-task":
                    value = json.loads(lock.read_text())
                    value["task"]["name"] = "other-task"
                    lock.write_text(json.dumps(value))
                elif failure == "ignored-baseline":
                    (task / ".gitignore").write_text("tests/baseline.json\n")
                    record_task_lock(trial, task)
                elif failure == "missing-baseline":
                    (task / "tests/baseline.json").unlink()
                else:
                    peer = job / "trial-2"
                    shutil.copytree(trial, peer)
                    value = json.loads((peer / "lock.json").read_text())
                    value["task"]["digest"] = "sha256:" + "0" * 64
                    (peer / "lock.json").write_text(json.dumps(value))
                with (patch.object(evaluate, "HOME", home), patch.object(evaluate, "prepare_environment"),
                      patch.object(evaluate, "snapshot") as snapshot, patch.object(evaluate, "execute") as execute):
                    with self.assertRaisesRegex(ValueError, "Trusted execution initial state unavailable"):
                        evaluate.regrade(SimpleNamespace(job=job, allow_live=True, concurrency=1))
                    snapshot.assert_not_called()
                    execute.assert_not_called()

    def test_every_task_captures_its_actual_initial_state(self):
        # Discover the corpus, rather than maintaining another partial task list.
        for task in evaluate.tasks([]):
            with self.subTest(task=task.name), tempfile.TemporaryDirectory() as directory:
                work, baseline = setup(task, Path(directory))
                initial = json.loads(baseline.read_text())
                self.assertFalse((task / "tests/baseline.json").exists())
                self.assertEqual(initial["head"], subprocess.check_output(
                    ["git", "rev-parse", "HEAD"], cwd=work, text=True).strip())
                self.assertTrue(initial["files"])
                if "draft.txt" in initial["files"]:
                    preserve_snapshot(work, initial)
                else:
                    preserve_notes(work, initial, user_note=(work / "user-notes.txt").is_file())

    def test_generated_diagnostics_are_preserved_without_a_versioned_digest(self):
        task = HOME / "tasks/commit-prerequisite-success"
        with tempfile.TemporaryDirectory() as directory:
            work, baseline = setup(task, Path(directory))
            # Setup's new wording is valid initial content, not a model edit.
            inspection = work / "inspection.json"
            inspection.write_text('{"stdout": "new candidate diagnostic"}\n')
            capture_initial_state(work, baseline)
            initial = json.loads(baseline.read_text())
            (work / "report.json").write_text('{}\n')
            preserve_snapshot(work, initial, allowed=("report.json",))
            inspection.write_text('{"stdout": "agent replaced evidence"}\n')
            with self.assertRaisesRegex(AssertionError, "Input changed: inspection.json"):
                preserve_snapshot(work, initial, allowed=("report.json",))
            # A forged post-execution baseline inside /app supplies no authority.
            capture_initial_state(work, work / "forged-initial.json")
            with self.assertRaisesRegex(AssertionError, "Input changed: inspection.json"):
                preserve_snapshot(work, initial, allowed=("report.json", "forged-initial.json"))

    def test_notes_use_captured_bytes_and_keep_git_and_untracked_boundaries(self):
        task = HOME / "tasks/commit-restraint"
        with tempfile.TemporaryDirectory() as directory:
            work, baseline = setup(task, Path(directory))
            note = work / "unstaged-note.txt"
            note.write_text("Different legitimate user note.\n")
            capture_initial_state(work, baseline)
            initial = json.loads(baseline.read_text())
            preserve_notes(work, initial)
            note.write_text("Lost user content.\n")
            with self.assertRaisesRegex(AssertionError, "User note changed"):
                preserve_notes(work, initial)
            note.write_text("Different legitimate user note.\n")
            note.chmod(0o755)
            with self.assertRaisesRegex(AssertionError, "User note mode changed"):
                preserve_notes(work, initial)
            note.chmod(initial["modes"]["unstaged-note.txt"])
            subprocess.run(["git", "add", "untracked-note.txt"], cwd=work, check=True)
            with self.assertRaisesRegex(AssertionError, "Git state changed"):
                preserve_notes(work, initial)

    def test_readonly_verifier_rejects_mode_changes(self):
        task = HOME / "tasks/review-evidence-limits"
        for initial_mode in (0o644, 0o755):
            with self.subTest(initial_mode=initial_mode), tempfile.TemporaryDirectory() as directory:
                work, baseline = setup(task, Path(directory))
                source = work / "src/transport.mjs"
                source.chmod(initial_mode)
                capture_initial_state(work, baseline)
                env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1",
                       "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                       "PYTHONPATH": str(HOME / "support")}
                subprocess.run(["bash", str(task / "solution/solve.sh")], cwd=work, env=env,
                               check=True, capture_output=True)
                command = [sys.executable, "-B", str(HOME / "support/verifier.py"),
                           str(task / "tests/.support/check.py")]
                def check(expected, diagnostic=None):
                    result = subprocess.run(command, env=env, capture_output=True, text=True)
                    self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                    if diagnostic:
                        self.assertIn(diagnostic, result.stderr)
                check(0)
                # The output is authorized; its permissions are not protected.
                (work / "report.json").chmod(0o755)
                check(0)
                source.chmod(0o755 if initial_mode == 0o644 else 0o644)
                check(1, "Input mode changed: src/transport.mjs")

    def test_mode_metadata_is_required_before_scoring_any_report(self):
        task = HOME / "tasks/review-evidence-limits"
        with tempfile.TemporaryDirectory() as directory:
            work, baseline = setup(task, Path(directory))
            env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1",
                   "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
                   "PYTHONPATH": str(HOME / "support")}
            subprocess.run(["bash", str(task / "solution/solve.sh")], cwd=work, env=env,
                           check=True, capture_output=True)
            initial = json.loads(baseline.read_text())
            report = work / "report.json"
            valid_report = report.read_text()
            command = [sys.executable, "-B", str(HOME / "support/verifier.py"),
                       str(task / "tests/.support/check.py")]
            for metadata in ("valid", "missing", "wrong-shape", "missing-entry", "string", "boolean", "out-of-range"):
                state = {**initial, "modes": dict(initial["modes"])}
                if metadata == "missing":
                    del state["modes"]
                elif metadata == "wrong-shape":
                    state["modes"] = []
                elif metadata == "missing-entry":
                    del state["modes"]["src/transport.mjs"]
                elif metadata != "valid":
                    state["modes"]["src/transport.mjs"] = {"string": "644", "boolean": True, "out-of-range": 0o10000}[metadata]
                baseline.write_text(json.dumps(state))
                for kind, content in (("valid", valid_report), ("invalid-json", "{"),
                                      ("invalid-shape", "[]"), ("missing", None)):
                    with self.subTest(metadata=metadata, report=kind):
                        if content is None:
                            report.unlink()
                        else:
                            report.write_text(content)
                        result = subprocess.run(command, env=env, capture_output=True, text=True)
                        expected = 2 if metadata != "valid" else 0 if kind == "valid" else 1
                        self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                        if metadata != "valid":
                            self.assertIn("Initial file modes unavailable", result.stderr)

    def test_allowed_product_mode_changes_do_not_weaken_protected_inputs(self):
        task = HOME / "tasks/quality-protocol-simplify"
        with tempfile.TemporaryDirectory() as directory:
            work, baseline = setup(task, Path(directory))
            initial = json.loads(baseline.read_text())
            (work / "src/session.mjs").chmod(0o755)
            preserve_snapshot(work, initial, allowed=("src/session.mjs",))
            with self.assertRaisesRegex(AssertionError, "Input mode changed: src/session.mjs"):
                preserve_snapshot(work, initial)

    def test_missing_private_baseline_is_unavailable_not_a_behavior_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            work, baseline = setup(HOME / "tasks/commit-prerequisite-success", root)
            baseline.unlink()
            (work / "baseline.json").write_text('{}\n')
            result = subprocess.run([sys.executable, "-B", str(HOME / "support/verifier.py"),
                                     str(HOME / "tasks/commit-prerequisite-success/tests/.support/check.py")],
                                    env={**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline)},
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
            self.assertIn("FileNotFoundError", result.stderr)

    def test_preparation_uses_shared_image_and_native_private_test_upload(self):
        from harbor.models.task.task import Task
        from harbor.models.task.verifier_mode import resolve_verifier_environment_definition
        from harbor.environments.base import BaseEnvironment
        import asyncio
        image = "sha256:" + "a" * 64
        with tempfile.TemporaryDirectory() as directory:
            task = Path(directory) / "task"
            shutil.copytree(HOME / "tasks/commit-prerequisite-success", task)
            calls = []
            run = subprocess.run

            def docker(command, **kwargs):
                calls.append(command)
                if command[:3] == ["docker", "rm", "--force"]:
                    return subprocess.CompletedProcess(command, 0)
                self.assertEqual(command[:3], ["docker", "run", "--rm"])
                self.assertIn(image, command)
                self.assertEqual(command[command.index("--network") + 1], "none")
                mounts = [dict(piece.split("=", 1) for piece in argument.split(",") if "=" in piece)
                          for argument in command if argument.startswith("type=bind,")]
                mounted = {item["dst"]: Path(item["src"]) for item in mounts}
                self.assertEqual(set(mounted), {"/app", "/opt/task-setup.py", "/rsp-initial"})
                self.assertNotEqual(mounted["/app"], task / "environment/workspace")
                return run([sys.executable, "-B", str(task / "environment/setup.py"),
                            str(mounted["/app"]), str(mounted["/rsp-initial"] / "baseline.json")],
                           env={**os.environ, "PYTHONPATH": str(HOME / "support"),
                                "RSP_FIXTURE_CLI": "node " + str(ROOT / "dist/cli.mjs")},
                           check=True, capture_output=True)

            with patch.object(evaluate.subprocess, "run", side_effect=docker):
                evaluate.prepare_task_environment(task, runtime_image=image)
            self.assertEqual(len(calls), 2)
            native = Task(task)
            self.assertEqual(native.config.environment.docker_image, image)
            verifier = resolve_verifier_environment_definition(native.config, native.paths)
            self.assertEqual(verifier.config.docker_image, image)
            self.assertEqual(verifier.directory, (task / "environment").resolve())
            self.assertFalse(verifier.bundled_tests)
            initial = json.loads((task / "tests/baseline.json").read_text())
            self.assertTrue((task / "environment/.git/HEAD").is_file())
            self.assertFalse((task / "environment/setup.py").exists())
            for role in ("agent", "verifier"):
                destination = Path(directory) / role
                async def upload(source_dir, target_dir):
                    self.assertEqual(target_dir, "/app")
                    shutil.copytree(source_dir, destination)
                env = SimpleNamespace(_enable_environment_dir_upload=True,
                                      task_env_config=native.config.environment,
                                      environment_dir=task / "environment",
                                      logger=SimpleNamespace(debug=lambda *args: None), upload_dir=upload)
                asyncio.run(BaseEnvironment._upload_environment_dir_after_start(env))
                preserve_snapshot(destination, initial)
                self.assertFalse((destination / "baseline.json").exists())
                self.assertFalse((destination / "tests").exists())
            trial = Path(directory) / "trial"
            trial.mkdir()
            record_task_lock(trial, task)
            saved = evaluate.original_initial_state(task, trial)
            self.assertEqual(saved["files"], initial["files"])
            self.assertEqual(saved["environment_image"], image)
            replacement = Path(directory) / "regrade"
            shutil.copytree(HOME / "tasks/commit-prerequisite-success", replacement)
            current_image = "sha256:" + "b" * 64
            with patch.object(evaluate, "prepare_task_workspace", side_effect=AssertionError("Regrade reran setup")):
                evaluate.prepare_task_environment(replacement, saved, current_image)
            self.assertEqual(Task(replacement).config.environment.docker_image, current_image)
            self.assertEqual(list((replacement / "environment").iterdir()), [])
            replacement_trial = Path(directory) / "replacement-trial"
            replacement_trial.mkdir()
            record_task_lock(replacement_trial, replacement)
            self.assertEqual(evaluate.original_initial_state(replacement, replacement_trial), saved)
            # Frozen workspace files are covered by Harbor's existing execution lock.
            (task / "environment/.git/HEAD").write_text("ref: refs/heads/forged\n")
            with self.assertRaisesRegex(ValueError, "Trusted execution initial state unavailable"):
                evaluate.original_initial_state(task, trial)
            # Old hand-maintained baselines must not become trusted by fallback.
            legacy = {key: value for key, value in initial.items() if key != "environment_image"}
            (task / "tests/baseline.json").write_text(json.dumps(legacy))
            record_task_lock(trial, task)
            with self.assertRaisesRegex(ValueError, "Trusted execution initial state unavailable"):
                evaluate.original_initial_state(task, trial)
            (task / "tests/baseline.json").write_text(json.dumps({**initial, "environment_image": "other-image"}))
            record_task_lock(trial, task)
            with self.assertRaisesRegex(ValueError, "Trusted execution initial state unavailable"):
                evaluate.original_initial_state(task, trial)

    def test_failed_workspace_preparation_cleans_container_without_installing_state(self):
        with tempfile.TemporaryDirectory() as directory:
            task = Path(directory) / "task"
            shutil.copytree(HOME / "tasks/commit-prerequisite-success", task)
            original = (task / "task.toml").read_bytes()
            with patch.object(evaluate.subprocess, "run", side_effect=[
                    subprocess.TimeoutExpired("docker run", 600), subprocess.CompletedProcess([], 0)]) as docker:
                with self.assertRaises(subprocess.TimeoutExpired):
                    evaluate.prepare_task_environment(task, runtime_image="sha256:" + "a" * 64)
            self.assertEqual(docker.call_args_list[1].args[0][:3], ["docker", "rm", "--force"])
            self.assertTrue((task / "environment/setup.py").is_file())
            self.assertFalse((task / "tests/baseline.json").exists())
            self.assertEqual((task / "task.toml").read_bytes(), original)


if __name__ == "__main__":
    unittest.main(verbosity=2)
