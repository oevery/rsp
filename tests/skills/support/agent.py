"""Compatibility fixes for Harbor 0.24.0's native Codex execution path."""
from pathlib import Path, PurePosixPath
import json
import shutil
import tempfile

from tests.skills.support.usage import session_usage
import re
import shlex

from harbor.agents.installed.codex import Codex


class RoutedCodex(Codex):
    # Codex 0.150.1 refuses to create its tool helpers under a temporary home.
    # Harbor still owns setup, session retention and cleanup at this location.
    _REMOTE_CODEX_HOME = PurePosixPath("/opt/rsp-codex-home")

    def convert_trajectory(self, logs_dir):
        usage = session_usage(logs_dir)
        root = next((s for s in usage["sessions"] if s["id"] == usage.get("root")), None)
        if root is None:
            return None
        # Native conversion remains unchanged; isolate the identified parent so
        # Harbor cannot pick the lexicographically latest child session instead.
        with tempfile.TemporaryDirectory() as directory:
            shutil.copyfile(root["path"], Path(directory) / "root.jsonl")
            return self._convert_events_to_trajectory(Path(directory))

    def populate_context_post_run(self, context):
        super().populate_context_post_run(context)
        usage = session_usage(self.logs_dir)
        (self.logs_dir / "executor-usage.json").write_text(json.dumps(usage, indent=2) + "\n")
        total = usage["total"] or {}
        context.n_input_tokens = total.get("input_tokens")
        context.n_cache_tokens = total.get("cached_input_tokens")
        context.n_output_tokens = total.get("output_tokens")
        # Native pricing describes the root only; do not label it aggregate cost.
        context.cost_usd = None

    async def _upload_effective_config(self, environment, config, remote_path):
        # Harbor uploads config.toml, but not files referenced by that config.
        # The runner has already retained the selected model in immutable inputs.
        if catalog := config.get("model_catalog_json"):
            remote_catalog = self._REMOTE_CODEX_HOME / "models.json"
            await environment.upload_file(Path(catalog), remote_catalog.as_posix())
            config = {**config, "model_catalog_json": remote_catalog.as_posix()}
        await super()._upload_effective_config(environment, config, remote_path)

    async def exec_as_agent(self, environment, command, **kwargs):
        # The pinned native adapter strips everything before the final slash.
        # Only change its executor argument; retain setup, skills, ATIF,
        # cancellation, credentials and artifact handling upstream.
        if "codex exec " in command and "--model " in command:
            if not self.model_name or not re.fullmatch(r"[A-Za-z0-9_./:-]+", self.model_name):
                raise ValueError("Invalid routed model identifier")
            original = "--model " + self.model_name.split("/")[-1] + " "
            if command.count(original) != 1:
                raise RuntimeError("Pinned Harbor Codex command changed; revalidate adapter")
            command = command.replace(original, "--model " + shlex.quote(self.model_name) + " ", 1)
        return await super().exec_as_agent(environment, command, **kwargs)
