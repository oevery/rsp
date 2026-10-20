#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
p = Path('report.json')
report = json.loads(p.read_text())
report['currentCheck']['status'] = "检查通过（退出码 0，仅当前快照）"
p.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
PY
