from pathlib import Path
import json
import os

from outputs import read_object
from workspace import preserve_snapshot

ROOT = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
report = read_object(ROOT / "report.json")

from outputs import object_list, evidence_file

preserve_snapshot(ROOT, baseline, allowed=("report.json",))
findings = object_list(report.get("findings"), "findings")
assert findings, "Actual unsafe claim omitted"
for finding in findings:
    target = evidence_file(ROOT, finding.get("path"))
    assert target == ROOT / "migration.md" and finding.get("reason"), "Unsupported finding"
expected = {"src/transport.mjs": "blocked", "migration.md": "issues_found", "draft-plan.md": "clean"}
seen = set()
for item in object_list(report.get("coverage"), "coverage"):
    path = evidence_file(ROOT, item.get("path")).relative_to(ROOT).as_posix()
    assert path in expected and item.get("status") == expected[path], "Incorrect scoped judgment: " + path
    assert item.get("reason"), "Coverage reason missing"
    seen.add(path)
assert seen == set(expected), "Required coverage missing"

print("Outcome and preservation assertions passed")
