#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
mv test/noise.test.mjs test/recovery.test.mjs
python3 - <<'PY'
from pathlib import Path
path=Path('assessment.json')
path.write_text(path.read_text().replace('test/noise.test.mjs','test/recovery.test.mjs'))
PY
node tools/check.mjs
