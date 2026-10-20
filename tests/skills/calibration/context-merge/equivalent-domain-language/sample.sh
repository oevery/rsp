#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
path=Path('CONTEXT.md')
path.write_text(path.read_text().replace('UTC','Coordinated Universal Time'))
PY
