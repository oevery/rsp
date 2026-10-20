from pathlib import Path
import json
import os
from outputs import read_object, object_list, evidence_file
from workspace import preserve_snapshot
from verifier import node_contract
root = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
protected = ['src/link.mjs']
mutable = {p.relative_to(root).as_posix() for area in ("src", "test")
           for p in (root / area).rglob("*") if p.is_file()}
mutable.update(name for name in baseline["files"] if name.startswith(("src/", "test/")))
allowed = ["assessment.json", *sorted(mutable - set(protected))]
preserve_snapshot(root, baseline, allowed=allowed)
report = read_object(root / "assessment.json")
assert report.get("status") in ("corrected", "satisfied"), "Invalid contract disposition"
findings = object_list(report.get("findings"), "findings")
for finding in findings:
    evidence_file(root, finding.get("path"))
    assert finding.get("reason") and finding.get("consequence"), "Missing cause or consequence"
evidence = object_list(report.get("evidence"), "evidence")
assert evidence, "Missing evidence"
for item in evidence:
    evidence_file(root, item.get("path"))
    assert item.get("detail"), "Missing evidence detail"
assert isinstance(report.get("limits"), str) and report["limits"].strip(), "Missing limits"
node_contract(root / "tools/check.mjs", cwd=root)
node_contract(Path(__file__).resolve().parents[1] / "contracts.mjs")
print("Quality outcome and workspace preservation passed")
