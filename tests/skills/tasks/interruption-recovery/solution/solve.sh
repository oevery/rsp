#!/usr/bin/env bash
set -euo pipefail
cd "$(printenv RSP_WORKSPACE || echo /app)"
# Deterministic process reference, never native model-worker acceptance.
python3 - <<'PYCODE'
import json
from pathlib import Path
import subprocess
import sys
import time

command = [sys.executable, "tools/recovery.py"]
Path(".cache").mkdir(exist_ok=True)
with Path(".cache/oracle-process.log").open("w") as log:
    process = subprocess.Popen([*command, "begin"], stdout=log, stderr=subprocess.STDOUT)
    try:
        deadline = time.monotonic() + 10
        while not Path(".cache/partial.json").exists():
            assert process.poll() is None and time.monotonic() < deadline, "No partial write"
            time.sleep(0.02)
        assert process.poll() is None
        subprocess.run([*command, "pause"], check=True)
        assert process.wait(timeout=10) == 0
        subprocess.run([*command, "resume"], check=True)
    finally:
        if process.poll() is None:
            process.terminate()
            process.wait(timeout=10)
Path("report.json").write_text(json.dumps({
    "correctionCount": 1, "completed": True,
    "explanation": "Offline oracle: actual process pause and exit observed before continuation; snapshots retained. Native model workers were not run."
}) + "\n")
PYCODE
