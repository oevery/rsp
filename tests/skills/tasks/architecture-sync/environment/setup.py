"""Initialize an installed-project fixture with the selected source CLI."""
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

support = Path("/opt/rsp-eval")
if not (support / "workspace.py").is_file():
    support = Path(__file__).resolve().parents[3] / "support"
sys.path.insert(0, str(support))
from workspace import capture_initial_state, initialize_fixture

root, baseline = (Path(value).resolve() for value in sys.argv[1:3])
cli = shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp"))
subprocess.run([*cli, "init"], cwd=root, check=True, capture_output=True)
doctor = subprocess.run([*cli, "doctor", "--json"], cwd=root, check=True, text=True, capture_output=True)
report = json.loads(doctor.stdout)
assert report["ok"] and any(
    check.get("code") == "architecture_valid" and check["status"] == "ok"
    for check in report["checks"]
), report
# Fixture setup evidence is not agent execution or semantic acceptance.
initialize_fixture(root, {"user-notes.txt": "Original notes.\n", "staged-note.txt": "Original staged note.\n"})
(root / "user-notes.txt").write_text("User unstaged note: preserve.\n")
(root / "staged-note.txt").write_text("User staged note: preserve.\n")
(root / "draft.txt").write_text("User untracked draft: preserve.\n")
subprocess.run(["git", "add", "--", "staged-note.txt"], cwd=root, check=True)
capture_initial_state(root, baseline)
