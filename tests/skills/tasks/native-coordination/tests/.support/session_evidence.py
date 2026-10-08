"""Project retained native child tool events into the task judge's input."""
import json
from pathlib import Path


def collect(sessions, output):
    output.unlink(missing_ok=True)
    children = {}
    kinds = {"function_call", "function_call_output", "custom_tool_call", "custom_tool_call_output"}
    for path in sorted(sessions.rglob("*.jsonl")):
        events = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
        meta = next((e["payload"] for e in events if e.get("type") == "session_meta"), {})
        if not isinstance(meta.get("source"), dict) or "subagent" not in meta["source"]:
            continue
        identity = meta.get("id")
        if not identity or identity in children:
            raise ValueError("Missing or ambiguous child session identity")
        tools = [e for e in events if e.get("type") == "response_item" and e.get("payload", {}).get("type") in kinds]
        calls = {e["payload"].get("call_id") for e in tools if e["payload"]["type"] in ("function_call", "custom_tool_call")}
        results = {e["payload"].get("call_id") for e in tools if e["payload"]["type"].endswith("_output")}
        if not (calls & results) - {None}:
            raise ValueError(f"Child {identity} has no attributed tool call/result pair")
        attribution = {key: meta[key] for key in ("id", "source", "timestamp", "cwd", "cli_version") if key in meta}
        children[identity] = {"session": attribution, "tool_events": tools}
    if len(children) < 2:
        raise ValueError("Missing two retained child tool trajectories")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("".join(json.dumps(child) + "\n" for child in children.values()))


if __name__ == "__main__":
    collect(Path("/logs/agent/sessions"), Path("/logs/verifier/child-sessions.jsonl"))
