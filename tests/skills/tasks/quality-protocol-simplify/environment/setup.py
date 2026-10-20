"""Prepare this isolated fixture with existing workspace support."""
from pathlib import Path
import sys
support = Path("/opt/rsp-eval")
if not (support / "workspace.py").is_file():
    support = Path(__file__).resolve().parents[3] / "support"
sys.path.insert(0, str(support))
from workspace import initialize_fixture, snapshot_fixture
root = Path(sys.argv[1]).resolve()
initialize_fixture(root)
snapshot_fixture(root, Path(sys.argv[2]).resolve())
