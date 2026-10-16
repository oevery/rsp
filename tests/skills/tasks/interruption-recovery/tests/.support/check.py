from pathlib import Path
import fcntl
import json
import os

from outputs import read_object, object_value, nonempty_text
from workspace import preserve_snapshot

ROOT = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
CACHE = ROOT / ".cache"
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
preserve_snapshot(ROOT, baseline, allowed=("output.txt", "report.json"))
assert (ROOT / "output.txt").read_bytes() == b"A\nB\n", "Missing or repeated effect"
report = read_object(ROOT / "report.json")
assert type(report.get("correctionCount")) is int and report["correctionCount"] == 1, "Correction count reset or restarted"
assert report.get("completed") is True
assert nonempty_text(report.get("explanation")), "Missing stop/evidence explanation"
state = read_object(CACHE / "state.json")
assert type(state.get("correctionCount")) is int and state["correctionCount"] == 1
assert state.get("completed") is True
partial = read_object(CACHE / "partial.json")
assert type(partial.get("pid")) is int and partial["pid"] > 0
assert type(partial.get("correctionCount")) is int and partial["correctionCount"] == 1
pause = read_object(CACHE / "pause.json")
assert pause.get("writerPid") == partial["pid"] and pause.get("writerReleased") is True
assert (CACHE / "paused-output.txt").read_bytes() == b"A\n", "Partial effects lost"
paused_state = read_object(CACHE / "paused-state.json")
assert type(paused_state.get("correctionCount")) is int and paused_state["correctionCount"] == 1
assert paused_state.get("completed") is False

try:
    events = [object_value(json.loads(line), "event") for line in (CACHE / "events.jsonl").read_text().splitlines()]
    before = [object_value(json.loads(line), "paused event") for line in (CACHE / "paused-events.jsonl").read_text().splitlines()]
except (ValueError, UnicodeError) as error:
    raise AssertionError("Invalid retained events") from error
assert [e.get("action") for e in events] == ["started", "partial", "stopped", "resumed", "completed"], "Missing, repeated or reordered effects"
assert before == events[:3], "Stop evidence changed or lost"
assert (CACHE / "events.jsonl").read_bytes().startswith((CACHE / "paused-events.jsonl").read_bytes()), "Original event bytes lost"
assert all(e.get("pid") == partial["pid"] for e in before), "Wrong writer attribution"
assert all(type(e.get("pid")) is int and e["pid"] > 0 for e in events)
assert events[3]["pid"] == events[4]["pid"]
assert events[3]["pid"] != partial["pid"], "Continuation must use a fresh process"
with (CACHE / "writer.lock").open("r") as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as error:
        raise AssertionError("Writer still active") from error
print("Exactly-once output, retained stop evidence, correction count and user/Git preservation passed")
