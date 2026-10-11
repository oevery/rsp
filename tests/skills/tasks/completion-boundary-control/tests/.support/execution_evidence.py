"""Supply native command results to the judge without private reasoning."""
import json
from pathlib import Path


def collect(transcript, output):
    output.unlink(missing_ok=True)
    session = None
    commands = []
    for line in transcript.read_text().splitlines():
        if not line.startswith("{"):
            continue  # Codex may prefix its JSON stream with startup warnings.
        event = json.loads(line)
        if event.get("type") == "thread.started":
            session = event["thread_id"]
        item = event.get("item", {})
        if event.get("type") == "item.completed" and item.get("type") == "command_execution":
            commands.append({key: item[key] for key in
                             ("id", "command", "aggregated_output", "exit_code", "status")})
    if not session:
        raise ValueError("Native Codex session evidence unavailable")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"session": session, "commands": commands}, indent=2))


if __name__ == "__main__":
    collect(Path("/logs/agent/codex.txt"), Path("/logs/verifier/execution-evidence.json"))
