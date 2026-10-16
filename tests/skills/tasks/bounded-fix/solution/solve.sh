#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PYTHON'
from pathlib import Path
p = Path('src/expiry.mjs')
p.write_text(p.read_text().replace('now <= record.expiresAt', 'now < record.expiresAt'))
PYTHON
node tools/check.mjs
