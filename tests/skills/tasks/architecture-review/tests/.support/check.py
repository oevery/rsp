import json
import os
from pathlib import Path
import shlex
import subprocess

from outputs import evidence_file, nonempty_text, object_list, read_object
from workspace import preserve_snapshot

root = Path(os.environ["RSP_WORKSPACE"]).resolve()
baseline = json.loads(Path(os.environ["RSP_BASELINE"]).read_text())
preserve_snapshot(root, baseline, allowed=("report.json",))
cli = shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp"))
result = subprocess.run([*cli, "doctor", "--json"], cwd=root, text=True, capture_output=True)
assert result.returncode == 0, result.stdout + result.stderr
assert json.loads(result.stdout)["ok"], "Fixture doctor must remain healthy despite semantic drift"
report = read_object(root / "report.json")
findings = object_list(report.get("findings"), "findings")
assert findings, "The existing invoice model mismatch was reported as clean"
identified_nodes, identified_relations, evidence_paths = set(), set(), set()
for finding in findings:
    ids = finding.get("nodeIds")
    assert isinstance(ids, list) and all(isinstance(value, str) for value in ids), "nodeIds must be strings"
    relations = finding.get("relationIds")
    assert isinstance(relations, list) and all(isinstance(value, str) for value in relations), "relationIds must be strings"
    assert ids or relations, "Finding must locate affected model knowledge"
    assert set(ids) <= {"invoice", "pricing"}, "Finding accuses unrelated model nodes"
    assert set(relations) <= {"invoice-rounding"}, "Finding accuses correct control relationships"
    identified_nodes.update(ids)
    identified_relations.update(relations)
    assert all(nonempty_text(finding.get(key)) for key in ("summary", "consequence")), "Finding needs an explanation and consequence"
    refs = finding.get("evidence")
    assert isinstance(refs, list) and refs, "Missing finding evidence"
    assert all(nonempty_text(ref) for ref in refs), "Evidence must contain file references"
    evidence_paths.update(evidence_file(root, ref.partition(" — ")[0]).relative_to(root).as_posix() for ref in refs)
assert "invoice" in identified_nodes and "invoice-rounding" in identified_relations, "Report omits the stale responsibility or dependency"
assert {".rsp/architecture.json", ".rsp/specs/design.md", "src/export.mjs", "src/pricing.mjs"} <= evidence_paths, "Missing model, contract or consumer-owner evidence"
checks = object_list(report.get("checks"), "checks")
assert checks and all((nonempty_text(check.get("command")) or nonempty_text(check.get("description"))) and nonempty_text(check.get("result")) for check in checks), "Checks require commands or descriptions, and results"
limits = report.get("limitations")
assert nonempty_text(limits) or (isinstance(limits, list) and limits and all(nonempty_text(value) for value in limits)), "Report must state evidence limits"
print("Located mismatch, valid citations and read-only state verified; semantic grounding and truthful execution require judging.")
