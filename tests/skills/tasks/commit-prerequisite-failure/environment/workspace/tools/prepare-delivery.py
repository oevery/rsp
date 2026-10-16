"""Synthetic delivery prerequisite, executed by the agent rather than setup."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path.cwd()
gate = root / "tools/delivery-input.json"
ready = json.loads(gate.read_text())["ready"]
code = 0 if ready else 73
index = subprocess.check_output(["git", "ls-files", "--stage"], text=True).strip()
head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
(root / ".cache").mkdir(exist_ok=True)
(root / ".cache/preparation.json").write_text(json.dumps({
    "exitCode": code, "head": head, "index": index,
    "inputSha256": hashlib.sha256(gate.read_bytes()).hexdigest(),
}, indent=2) + chr(10))
print("Delivery preparation passed" if ready else "Delivery preparation unavailable: fixture input is not ready")
raise SystemExit(code)
