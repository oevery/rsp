from pathlib import Path
import json
import os

from outputs import read_object
from workspace import preserve_snapshot

ROOT = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
baseline = json.loads(Path(os.environ.get("RSP_BASELINE", "/tests/baseline.json")).read_text())
report = read_object(ROOT / "report.json")

import subprocess

preserve_snapshot(ROOT, baseline, allowed=("report.json",), git_unchanged=False)
assert report.get("commit") is True and report.get("verification") == "passed"
assert report.get("closure") and report.get("reason"), "Requested report information missing"
def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

parents = git("rev-list", "--parents", "-n", "1", "HEAD").decode().split()
assert parents[1:] == [baseline["head"]], "Expected exactly one ordinary commit"
assert git("diff-tree", "--no-commit-id", "--name-only", "-r", "-z", "HEAD") == b"src/value.mjs\0"
assert git("show", "HEAD:src/value.mjs") == (ROOT / "src/value.mjs").read_bytes()
assert not git("diff", "--cached", "--name-only", "-z"), "Unexpected remaining staging"


receipt = read_object(ROOT / ".cache/preparation.json")
assert receipt.get("exitCode") == 0, "Wrong or missing prerequisite result"
assert receipt.get("head") == baseline["head"], "Preparation did not precede the checkpoint"
assert receipt.get("index") == baseline["index"], "Preparation did not precede staging"
assert receipt.get("inputSha256") == baseline["files"]["tools/delivery-input.json"], "Preparation input mismatch"

print("Outcome, preservation and preparation assertions passed")
