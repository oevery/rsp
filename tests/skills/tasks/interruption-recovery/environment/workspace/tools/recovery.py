"""A bounded interruptible workload, not a model-worker lifecycle controller."""
import fcntl
import json
import os
from pathlib import Path
import signal
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache"
CACHE.mkdir(exist_ok=True)


def read(name):
    return json.loads((CACHE / name).read_text())


def write(name, value):
    temporary = CACHE / (name + ".tmp")
    temporary.write_text(json.dumps(value) + "\n")
    temporary.replace(CACHE / name)


def event(action):
    with (CACHE / "events.jsonl").open("a") as stream:
        stream.write(json.dumps({"action": action, "pid": os.getpid()}) + "\n")
        stream.flush()
        os.fsync(stream.fileno())


def lock_writer(lock):
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)


def main(action):
    with (CACHE / "writer.lock").open("a") as lock:
        if action == "pause":
            partial = read("partial.json")
            assert not (CACHE / "pause.json").exists(), "Pause already recorded"
            try:
                lock_writer(lock)
            except BlockingIOError:
                pass
            else:
                raise AssertionError("No active writer to pause")
            os.kill(partial["pid"], signal.SIGTERM)
            deadline = time.monotonic() + 10
            while True:
                try:
                    lock_writer(lock)
                    break
                except BlockingIOError:
                    assert time.monotonic() < deadline, "Writer did not release lock"
                    time.sleep(0.02)
            events = [json.loads(line) for line in (CACHE / "events.jsonl").read_text().splitlines()]
            assert events[-1] == {"action": "stopped", "pid": partial["pid"]}, "No cooperative stop evidence"
            (CACHE / "paused-output.txt").write_bytes((ROOT / "output.txt").read_bytes())
            for source, target in (("state.json", "paused-state.json"), ("events.jsonl", "paused-events.jsonl")):
                (CACHE / target).write_bytes((CACHE / source).read_bytes())
            write("pause.json", {"writerPid": partial["pid"], "writerReleased": True})
            print("Writer lock released; also await the process command and native worker.", flush=True)
            return

        lock_writer(lock)
        if action == "begin":
            assert not (CACHE / "state.json").exists(), "Correction already started; inspect effects, do not restart"
            assert (ROOT / "output.txt").read_bytes() == b"", "Existing partial effects"
            stopped = threading.Event()
            signal.signal(signal.SIGTERM, lambda *_: stopped.set())
            write("state.json", {"correctionCount": 1, "completed": False})
            event("started")
            with (ROOT / "output.txt").open("a") as stream:
                stream.write("A\n")
                stream.flush()
                os.fsync(stream.fileno())
            event("partial")
            write("partial.json", {"pid": os.getpid(), "correctionCount": 1})
            print("Partial output written; waiting for parent pause.", flush=True)
            assert stopped.wait(120), "Parent did not pause writer within fixture timeout"
            event("stopped")
            print("Stop signal observed; writer exiting.", flush=True)
        elif action == "resume":
            pause = read("pause.json")
            partial = read("partial.json")
            assert pause == {"writerPid": partial["pid"], "writerReleased": True}
            assert (ROOT / "output.txt").read_bytes() == (CACHE / "paused-output.txt").read_bytes() == b"A\n"
            assert (CACHE / "state.json").read_bytes() == (CACHE / "paused-state.json").read_bytes()
            assert read("state.json") == {"correctionCount": 1, "completed": False}
            assert (CACHE / "events.jsonl").read_bytes() == (CACHE / "paused-events.jsonl").read_bytes()
            event("resumed")
            with (ROOT / "output.txt").open("a") as stream:
                stream.write("B\n")
            write("state.json", {"correctionCount": 1, "completed": True})
            event("completed")
            print("Same correction completed; A and B written once.", flush=True)
        else:
            raise ValueError("Expected begin, pause or resume")


if __name__ == "__main__":
    main(sys.argv[1])
