from pathlib import Path
import json
import os

from outputs import read_object
from workspace import preserve_snapshot

ROOT = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
report = read_object(ROOT / "report.json")

preserve_snapshot(ROOT, baseline, allowed=("report.json",))
assert report.get("commit") is False and report.get("verification") == "unavailable"
assert report.get("closure") and report.get("reason"), "Requested report information missing"

print("Outcome and preservation assertions passed")
