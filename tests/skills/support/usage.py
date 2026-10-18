"""Attribute retained Codex usage to the root thread and its descendants."""
import json
from pathlib import Path

FIELDS = ("input_tokens", "cached_input_tokens", "output_tokens")


def events(path, invalid=None):
    for number, line in enumerate(path.read_text().splitlines(), 1):
        try:
            value = json.loads(line)
        except ValueError as error:
            if invalid is not None and line.strip():
                invalid.append((number, error))
            continue
        if isinstance(value, dict):
            yield value


def session_usage(logs, *, validate_sessions=False):
    """Optionally validate attributed JSON for reports without rereading files."""
    logs = Path(logs)
    stream = logs / "codex.txt"
    roots = {e.get("thread_id") for e in events(stream) if e.get("type") == "thread.started"} if stream.is_file() else set()
    roots.discard(None)
    if len(roots) != 1:
        return {"status": "unavailable", "reason": "missing or ambiguous root thread", "sessions": [], "total": None}
    root = roots.pop()
    records = {}
    invalid_sessions = {}
    for path in sorted((logs / "sessions").rglob("*.jsonl")):
        invalid = [] if validate_sessions else None
        data = list(events(path, invalid))
        meta = next((e.get("payload", {}) for e in data if e.get("type") == "session_meta"), {})
        identity = meta.get("id")
        if not identity:
            continue
        if invalid:
            number, error = invalid[0]
            invalid_sessions[identity] = (path, number, error)
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
    for identity in sorted(selected):
        if identity in invalid_sessions:
            path, number, error = invalid_sessions[identity]
            raise json.JSONDecodeError(f"{path}:{number}: {error.msg}", error.doc, error.pos) from error
    complete = bool(sessions) and all(s["usage"] is not None and all(type(s["usage"][key]) is int and s["usage"][key] >= 0 for key in FIELDS) for s in sessions)
    total = {key: sum(s["usage"][key] for s in sessions) for key in FIELDS} if complete else None
    return {"status": "complete" if complete else "unavailable", "root": root, "sessions": sessions, "total": total,
            "scope": "retained executor root and descendants; excludes judges", "unattributed_sessions": sorted(set(records) - selected)}
