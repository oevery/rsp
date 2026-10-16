from pathlib import Path
import json
import os

from outputs import read_object
from workspace import preserve_snapshot

ROOT = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
report = read_object(ROOT / "report.json")

preserve_snapshot(ROOT, baseline, allowed=("report.json", ".rsp/specs/design.md"))
spec = ROOT / ".rsp/specs/design.md"
assert spec.is_file() and not spec.is_symlink(), "Updated Spec missing or replaced"
assert spec.read_text().strip(), "Updated Spec is empty"
# Meaning and open/pending-work judgments belong to the semantic judge.
import hashlib
assert hashlib.sha256(spec.read_bytes()).hexdigest() != baseline["files"][".rsp/specs/design.md"], "Requested update missing"
assert report.get("closure") and report.get("remainingWork"), "Requested report information missing"

print("Outcome and preservation assertions passed")
