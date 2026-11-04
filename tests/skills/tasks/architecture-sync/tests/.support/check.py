import json
import os
from pathlib import Path
import shlex
import subprocess

from outputs import read_object
from verifier import node_contract
from workspace import preserve_snapshot

root = Path(os.environ["RSP_WORKSPACE"]).resolve()
baseline = json.loads(Path(os.environ["RSP_BASELINE"]).read_text())
preserve_snapshot(root, baseline, allowed=("src/export.mjs", ".rsp/architecture.json"))
node_contract(Path(__file__).with_name("contracts.mjs"), cwd=root)
cli = shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp"))
result = subprocess.run([*cli, "doctor", "--json"], cwd=root, text=True, capture_output=True)
assert result.returncode == 0, result.stdout + result.stderr
doctor = json.loads(result.stdout)
assert doctor["ok"] and any(c.get("code") == "architecture_valid" for c in doctor["checks"]), doctor
before = json.loads(subprocess.check_output(["git", "show", "HEAD:.rsp/architecture.json"], cwd=root, text=True))
model = read_object(root / ".rsp/architecture.json")
for collection in ("nodes", "relations"):
    assert {item["id"] for item in model[collection]} == {item["id"] for item in before[collection]}, "Stable model identities changed"
for collection, affected in (("nodes", "invoice"), ("relations", "invoice-rounding")):
    old = {item["id"]: item for item in before[collection]}
    for item in model[collection]:
        if item["id"] != affected:
            assert item == old[item["id"]], "Unrelated architecture knowledge changed"
for collection in ("views", "bindings"):
    assert model[collection] == before[collection], "Navigation or document bindings changed"
edge = next(item for item in model["relations"] if item["id"] == "invoice-rounding")
assert edge["source"] == "invoice" and edge["target"] == "pricing", "Invoice dependency still omits the pricing owner"
node = next(item for item in model["nodes"] if item["id"] == "invoice")
old_node = next(item for item in before["nodes"] if item["id"] == "invoice")
assert node["description"] != old_node["description"], "Invoice responsibility still describes local truncation"
print("Consumer behavior, owner dependency, model structure and preservation verified; description meaning requires semantic judging.")
