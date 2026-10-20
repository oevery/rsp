#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
import json
path=Path('report.json')
report=json.loads(path.read_text())
report['findings']=[{'path':'src/discount.mjs','line':2,'reason':'The index returns discount amount instead of final payable price: price 100 and rate 0.2 return 20 rather than 80. This same contract defect explains the API-comment inconsistency.'},{'path':'src/discount.mjs','line':1,'reason':'Same payable-price contract defect as the calculation observation: the API comment describes the discount amount. These observations share one cause, not two runtime defects.'}]
path.write_text(json.dumps(report,indent=2))
PY
