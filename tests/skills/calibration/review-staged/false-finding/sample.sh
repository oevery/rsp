#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
p=Path('report.json')
r=json.loads(p.read_text())
r['findings'][0]['reason']='The staged function always returns zero because it assigns price = 0. discount(100, 0.2) returns 0. Its comment promises a network request which never happens. The defect is this assignment and missing network behavior.'
p.write_text(json.dumps(r,indent=2)+'\n')
PY
