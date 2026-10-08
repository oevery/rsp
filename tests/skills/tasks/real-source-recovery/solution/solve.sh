#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
p=Path('src/core/issue-relationship.ts');p.write_text(p.read_text().replace('if (false && seen.has(url))','if (seen.has(url))'))
p=Path('src/core/path-identity.ts');p.write_text(p.read_text().replace("candidate !== '__disabled__'", "candidate !== '..'"))
PY
node --experimental-transform-types tools/check.mjs
