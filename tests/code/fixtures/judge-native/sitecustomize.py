"""Test-only SDK boundary, loaded only by the copied task's grade process."""
import atexit
import hashlib
import json
import os
from pathlib import Path
import socket
import sys
from types import SimpleNamespace


if Path(sys.argv[0]).name == "grade.py":
    os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    import litellm

    scenario = os.environ["RSP_OFFLINE_JUDGE_CASE"]
    responses = {
        "valid-low": [False],
        "format-then-success": ["invalid-format-1", True],
        "format-exhausted": ["invalid-format-1", "invalid-format-2", "invalid-format-3"],
        "timeout": ["timeout"],
    }[scenario]
    attempts = []
    blocked_connections = []

    async def completion(**kwargs):
        index = len(attempts)
        if index >= len(responses):
            raise AssertionError("Unexpected additional SDK call")
        value = responses[index]
        if value == "timeout":
            attempts.append({"attempt": index + 1, "error": "litellm.Timeout"})
            raise litellm.Timeout(message="offline timeout control",
                                  model="openai/test-model", llm_provider="openai")
        content = (json.dumps({"score": value, "reasoning": "offline control"})
                   if isinstance(value, bool) else value)
        attempts.append({"attempt": index + 1, "content": content})
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    def deny_network(*args, **kwargs):
        blocked_connections.append("Unexpected socket connection")
        raise AssertionError("Unexpected socket connection")

    def retain():
        modules = {}
        for name in ("grade", "checks", "verifier", "workspace", "outputs"):
            path = Path("/opt/rsp-eval") / (name + ".py")
            modules[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        Path("/logs/verifier/sdk-observation.json").write_text(json.dumps({
            "scenario": scenario, "attempts": attempts, "sdkCalls": len(attempts),
            "blockedConnections": blocked_connections,
            "interfaces": sorted(p.name for p in Path("/sys/class/net").iterdir()),
            "gradeEntry": sys.argv[0], "bakedModuleHashes": modules,
        }, indent=2))

    litellm.acompletion = completion
    socket.socket.connect = deny_network
    socket.create_connection = deny_network
    atexit.register(retain)
