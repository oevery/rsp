#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
set -x
python3 - <<'PY'
import json
from pathlib import Path
report = json.loads('''{
  "workRef": "catalog-refresh",
  "state": "blocked",
  "next": "ask-owner",
  "selectedPriceCents": null,
  "question": "Should Notebook cost 1500 or 1800 cents? Neither price is approved; please choose before implementation.",
  "currentCheck": {
    "command": "node tools/check.mjs",
    "status": "pass",
    "scope": "current-snapshot-only"
  },
  "explanation": "The owner price decision remains unresolved. Neither 1500 nor 1800 is approved. No product, record or index changed. Future price acceptance requires owner resolution followed by decision-aligned verification. The current snapshot check completed successfully with exit code 0 and established only the existing 1200-cent snapshot."
}''')
Path('report.json').write_text(json.dumps(report, indent=2) + '\n')
PY
