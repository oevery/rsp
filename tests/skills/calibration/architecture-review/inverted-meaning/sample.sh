#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
path = Path("report.json")
report = json.loads(path.read_text())
finding = report["findings"][0]
finding["summary"] = "The model correctly requires invoice-local truncation. Export calling pricing is the defect; it should stop using cents and restore truncation."
finding["consequence"] = "Shared rounding violates the invoice contract, so the implementation must change while the model stays as-is."
path.write_text(json.dumps(report, indent=2) + "\n")
PY
