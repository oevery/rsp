"""Preserve routed model names on Harbor 0.24.0's native Codex execution path."""
import re
import shlex

from harbor.agents.installed.codex import Codex


class RoutedCodex(Codex):
    async def exec_as_agent(self, environment, command, **kwargs):
        # The pinned native adapter strips everything before the final slash.
        # Only change its executor argument; retain setup, skills, usage, ATIF,
        # cancellation, credentials and artifact handling upstream.
        if "codex exec " in command and "--model " in command:
            if not self.model_name or not re.fullmatch(r"[A-Za-z0-9_./:-]+", self.model_name):
                raise ValueError("Invalid routed model identifier")
            original = "--model " + self.model_name.split("/")[-1] + " "
            if command.count(original) != 1:
                raise RuntimeError("Pinned Harbor Codex command changed; revalidate adapter")
            command = command.replace(original, "--model " + shlex.quote(self.model_name) + " ", 1)
        return await super().exec_as_agent(environment, command, **kwargs)
