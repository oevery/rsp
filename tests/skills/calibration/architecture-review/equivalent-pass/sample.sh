#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
path = Path("report.json")
report = json.loads(path.read_text())
report["findings"] = [
    {
        "nodeIds": ["invoice"],
        "relationIds": [],
        "summary": "The invoice description still assigns it local truncation, while export delegates monetary conversion to pricing.",
        "consequence": "Readers could maintain a second rounding policy in invoice even though the settled contract assigns that policy to pricing.",
        "evidence": [".rsp/architecture.json:L7", "src/export.mjs:L1-L2", ".rsp/specs/design.md:L3-L7"]
    },
    {
        "nodeIds": [],
        "relationIds": ["invoice-rounding"],
        "summary": "The invoice-to-itself dependency omits the real call to pricing.cents.",
        "consequence": "Impact analysis based on the diagram would omit invoice when the shared cents policy changes.",
        "evidence": [".rsp/architecture.json:L12", "src/export.mjs:L1-L2", "src/pricing.mjs:1:1", "src/main.mjs"]
    }
]
path.write_text(json.dumps(report, indent=2) + "\n")
PY
