#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
path=Path('src/noise.mjs')
path.write_text(path.read_text().replace("new Error('unconfirmed level')", "new RangeError('outside supported range')"))
PY
node tools/check.mjs
