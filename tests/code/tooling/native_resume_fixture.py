"""Real wrapper/native recovery gates with an offline trial execution boundary."""
import asyncio
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import traceback
from types import SimpleNamespace
from unittest.mock import patch

from harbor.cli.jobs import resume as native_resume
from harbor.environments.factory import EnvironmentFactory
from harbor.job import Job
from harbor.models.job.config import JobConfig
from harbor.models.job.lock import build_trial_lock
from harbor.models.task.task import Task
from harbor.models.trial.paths import TrialPaths
from harbor.models.trial.result import AgentInfo, ExceptionInfo, TrialResult
from harbor.models.verifier.result import VerifierResult
from harbor.tasks.client import TaskDownloadResult
from harbor.trial.hooks import TrialEvent, TrialHookEvent
from harbor.trial.trial import Trial


def hashes(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob("*")) if p.is_file()}


def exercise(root, drift, evaluate):
    """Keep the caller-owned directory, including synthetic failures and backups."""
    assert drift in ("none", "task", "skill")
    root = Path(root).resolve()
    home = root / "home"
    job_dir = root / "job"
    inputs = root / "job.inputs"
    shutil.copytree(evaluate.HOME / "support", home / "support", ignore=shutil.ignore_patterns("__pycache__"))
    shutil.copy2(evaluate.HOME / "uv.lock", home / "uv.lock")
    shutil.copytree(home, inputs)
    (inputs / "source.json").write_text(json.dumps({"image": "offline-image"}))
    skill = inputs / "skills/offline-example"
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text("---\nname: offline-example\ndescription: Offline fixture skill.\n---\nPreserve evidence.\n")
    for name in ("good-task", "failed-task"):
        task = inputs / "tasks" / name
        (task / "environment").mkdir(parents=True)
        (task / "tests").mkdir()
        (task / "solution").mkdir()
        (task / "task.toml").write_text('version = "1.0"\n')
        (task / "instruction.md").write_text("Offline recovery boundary fixture.\n")
        (task / "environment/Dockerfile").write_text("FROM scratch\n")
        (task / "tests/test.sh").write_text("#!/bin/sh\nexit 0\n")
        (task / "solution/solve.sh").write_text("#!/bin/sh\nexit 0\n")
    config = JobConfig.model_validate({
        "job_name": "job", "jobs_dir": str(root), "quiet": True,
        "n_attempts": 1, "n_concurrent_trials": 1, "retry": {"max_retries": 0},
        "agents": [{"name": "codex", "model_name": "offline-fixture", "skills": [str(skill)]}],
        "environment": {"type": "docker"},
        "tasks": [{"path": str(inputs / "tasks" / name)} for name in ("good-task", "failed-task")],
    })
    phase = "seed"
    dispatches = []

    class OfflineTrial:
        # Vendor execution boundary only: native Job, queue, locks and CLI are real.
        def __init__(self, trial_config):
            self.config = trial_config
            self.paths = TrialPaths(trial_dir=trial_config.trials_dir / trial_config.trial_name)
            self.hooks = {event: [] for event in TrialEvent}
            self.task = Task(trial_config.task.path)
            self.lock = build_trial_lock(trial_config=trial_config,
                task_download_result=TaskDownloadResult(path=trial_config.task.path, download_time_sec=0, cached=True))

        def add_hook(self, event, callback):
            self.hooks[event].append(callback)

        async def emit(self, event, result):
            value = TrialHookEvent(event=event, task_name=self.task.name, config=self.config, result=result, lock=self.lock)
            for callback in self.hooks[event]:
                await callback(value)

        async def run(self):
            self.paths.mkdir()
            self.paths.config_path.write_text(self.config.model_dump_json(indent=4, exclude_defaults=True))
            self.paths.lock_path.write_text(self.lock.model_dump_json(indent=4))
            result = TrialResult(task_name=self.task.name, trial_name=self.config.trial_name,
                trial_uri=self.paths.trial_dir.as_uri(), task_id=self.config.task.get_task_id(),
                task_checksum=self.task.checksum, config=self.config,
                agent_info=AgentInfo(name="codex", version="offline-stand-in"), started_at=datetime.now(timezone.utc))
            await self.emit(TrialEvent.START, result)
            fail = phase == "seed" and self.task.name == "failed-task"
            command = [sys.executable, "-c", "print('offline trial boundary'); raise SystemExit(" + ("7" if fail else "0") + ")"]
            process = subprocess.run(command, capture_output=True, text=True, check=False)
            receipt = {"phase": phase, "task": self.task.name, "trial": self.config.trial_name,
                       "exitCode": process.returncode, "stdout": process.stdout, "stderr": process.stderr}
            (self.paths.trial_dir / "execution.json").write_text(json.dumps(receipt, indent=2))
            if fail:
                result.exception_info = ExceptionInfo.from_exception(RuntimeError("Synthetic offline trial exit 7"))
            else:
                result.verifier_result = VerifierResult(rewards={"reward": 1.0})
            result.finished_at = datetime.now(timezone.utc)
            self.paths.result_path.write_text(result.model_dump_json(indent=4))
            await self.emit(TrialEvent.END, result)
            return result

    async def create_trial(trial_config):
        dispatches.append({"phase": phase, "task": Path(trial_config.task.path).name})
        return OfflineTrial(trial_config)

    native_error = None

    def invoke_native(*command):
        nonlocal native_error
        assert list(command) == ["jobs", "resume", "-y", "-p", job_dir, "-f", "RuntimeError"]
        log = io.StringIO()
        try:
            with redirect_stdout(log), redirect_stderr(log):
                native_resume(job_path=job_dir, filter_error_types=["RuntimeError"], yes=True)
            return 0
        except Exception as error:
            native_error = {"type": type(error).__name__, "message": str(error)}
            traceback.print_exc(file=log)
            return 1
        finally:
            (root / "native-resume.log").write_text(log.getvalue())

    # Live flags are synthetic inputs to the real authorization gate; no native
    # executor, container or judge can run through the replaced execution boundary.
    env = {"RSP_EVAL_OFFLINE": "0", "HARBOR_TELEMETRY": "0", "LITELLM_LOCAL_MODEL_COST_MAP": "True"}
    with patch.dict(evaluate.os.environ, env), patch.object(Trial, "create", side_effect=create_trial), \
            patch.object(EnvironmentFactory, "run_preflight"), \
            patch.object(evaluate, "HOME", home), patch.object(evaluate, "image_identity", return_value="offline-image"):
        initial = asyncio.run(Job.create(config))
        asyncio.run(initial.run())
        evaluate.report(job_dir)
        trials = {r["task_name"]: d for d, r in evaluate.native_results(job_dir)}
        good = trials["good-task"]
        failed = trials["failed-task"]
        before = hashes(job_dir)
        good_before, failed_before = hashes(good), hashes(failed)
        input_before = hashes(inputs)
        if drift == "task":
            (inputs / "tasks/failed-task/instruction.md").write_text("Changed saved task.\n")
        elif drift == "skill":
            with (skill / "SKILL.md").open("a") as output:
                output.write("Changed saved Skill.\n")
        input_after_mutation = hashes(inputs)
        phase = "resume"
        with patch.object(evaluate, "harbor", side_effect=invoke_native):
            exit_code = evaluate.resume(SimpleNamespace(job=job_dir, allow_live=True, error_type=["RuntimeError"]))
        after = hashes(job_dir)
        archives = list((root / "job.attempts").iterdir())
        assert len(archives) == 1
        archive = archives[0]
        backup_failed = hashes(archive / failed.name)
        metadata = {name: before[name] for name in ("config.json", "result.json", "lock.json", "summary.md", "job.log") if name in before}
        changed = {name: {"before": before.get(name), "after": after.get(name)}
                   for name in sorted(before.keys() | after.keys()) if before.get(name) != after.get(name)}
        observation = {"scenario": drift, "exitCode": exit_code, "nativeError": native_error,
            "dispatches": dispatches, "goodTrial": good.name, "failedTrial": failed.name,
            "goodBefore": good_before, "goodAfter": hashes(good), "failedBefore": failed_before,
            "backupFailed": backup_failed, "metadataBefore": metadata,
            "backupMetadata": {name: hashlib.sha256((archive / name).read_bytes()).hexdigest() for name in metadata},
            "successfulTrialBackedUp": (archive / good.name).exists(),
            "oldFailedTrialExists": failed.exists(), "lockUnchanged": before["lock.json"] == after.get("lock.json"),
            "inputMutationRetained": hashes(inputs) == input_after_mutation,
            "inputChangedPaths": [name for name in input_before if input_before[name] != input_after_mutation.get(name)],
            "jobEffects": changed, "resultTasks": [r["task_name"] for _, r in evaluate.native_results(job_dir)],
            "report": (job_dir / "summary.md").read_text()}
        (root / "observation.json").write_text(json.dumps(observation, indent=2) + "\n")
        return observation
