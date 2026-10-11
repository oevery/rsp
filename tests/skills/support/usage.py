"""Attribute retained Codex usage to the root thread and its descendants."""
import json
from pathlib import Path

FIELDS = ("input_tokens", "cached_input_tokens", "output_tokens")


def events(path):
    for line in path.read_text().splitlines():
        try:
            value = json.loads(line)
        except ValueError:
            continue
        if isinstance(value, dict):
            yield value


def session_usage(logs):
    logs = Path(logs)
    stream = logs / "codex.txt"
    roots = {e.get("thread_id") for e in events(stream) if e.get("type") == "thread.started"} if stream.is_file() else set()
    roots.discard(None)
    if len(roots) != 1:
        return {"status": "unavailable", "reason": "missing or ambiguous root thread", "sessions": [], "total": None}
    root = roots.pop()
    records = {}
    for path in sorted((logs / "sessions").rglob("*.jsonl")):
        data = list(events(path))
        meta = next((e.get("payload", {}) for e in data if e.get("type") == "session_meta"), {})
        identity = meta.get("id")
        if not identity:
            continue
        source = meta.get("source")
        subagent = source.get("subagent") if isinstance(source, dict) else None
        spawned = subagent.get("thread_spawn", subagent) if isinstance(subagent, dict) else {}
        parent = spawned.get("parent_thread_id") if isinstance(spawned, dict) else None
        totals = [e["payload"]["info"].get("total_token_usage") for e in data
                  if e.get("type") == "event_msg" and e.get("payload", {}).get("type") == "token_count"
                  and isinstance(e["payload"].get("info"), dict)]
        usage = totals[-1] if totals else None
        usage = {key: usage.get(key) for key in FIELDS} if isinstance(usage, dict) else None
        record = {"id": identity, "parent": parent, "path": str(path), "usage": usage}
        if identity in records:
            if records[identity]["usage"] != usage or records[identity]["parent"] != parent:
                return {"status": "unavailable", "reason": "conflicting duplicate session", "sessions": [], "total": None}
        else:
            records[identity] = record
    selected = {root} if root in records else set()
    while True:
        children = {key for key, value in records.items() if value["parent"] in selected}
        if children <= selected:
            break
        selected |= children
    sessions = [records[key] for key in sorted(selected)]
    complete = bool(sessions) and all(s["usage"] is not None and all(type(s["usage"][key]) is int and s["usage"][key] >= 0 for key in FIELDS) for s in sessions)
    total = {key: sum(s["usage"][key] for s in sessions) for key in FIELDS} if complete else None
    return {"status": "complete" if complete else "unavailable", "root": root, "sessions": sessions, "total": total,
            "scope": "retained executor root and descendants; excludes judges", "unattributed_sessions": sorted(set(records) - selected)}
