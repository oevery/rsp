#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
p=Path('src/pricing.mjs');p.write_text(p.read_text().replace('Math.trunc','Math.round'))
p=Path('src/checkout.mjs');s=chr(10).join(x for x in p.read_text().splitlines() if 'const gross =' not in x)+chr(10);p.write_text(s.replace('gross >= 2000','subtotalCents >= 2000'))
PY
node tools/check.mjs
