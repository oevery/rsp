"""Drive the built CLI through real PTY confirmation after project pin drift."""
import fcntl
import json
import os
from pathlib import Path
import pty
import select
import struct
import subprocess
import sys
import termios
import time

cli, project = Path(sys.argv[1]), Path(sys.argv[2])
master, slave = pty.openpty()
fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 120, 0, 0))
process = subprocess.Popen(
    ["node", str(cli), "skills"], cwd=project, stdin=slave, stdout=slave, stderr=slave,
    env={**os.environ, "CI": "false", "TERM": "xterm-256color", "RSP_UI_LANG": "en"},
)
os.close(slave)
output = bytearray()


def drain_until(predicate):
    deadline = time.monotonic() + 5
    while not predicate() and time.monotonic() < deadline and process.poll() is None:
        if select.select([master], [], [], 0.05)[0]:
            try:
                output.extend(os.read(master, 65536))
            except OSError:
                break
    return predicate()


try:
    # First paint can precede Ink's input effect; synchronize on real raw mode too.
    ready = drain_until(lambda: b"Enter install suite" in output
                        and not (termios.tcgetattr(master)[3] & termios.ICANON))
    if not ready:
        raise RuntimeError("Skills terminal never became confirmation-ready")
    (project / ".rsp/version").write_bytes(b"1.0.0" + bytes([10]))
    os.write(master, bytes([13]))
    drain_until(lambda: process.poll() is not None)
    process.wait(timeout=2)
    print(json.dumps({"ready": ready, "status": process.returncode,
                      "installed": (project / ".agents/skills/rsp/SKILL.md").exists()}))
finally:
    if process.poll() is None:
        process.kill()
        process.wait(timeout=5)
    os.close(master)
