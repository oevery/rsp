#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node tools/build.mjs
node tools/check.mjs
python3 - <<'PY'
from pathlib import Path
p=Path('.rsp/changes/catalog-refresh.md');s=p.read_text().replace('- [ ] Generate storefront.','- [x] Generate storefront.').replace('- [ ] Verify synchronized output.','- [x] Verify synchronized output.').replace('- [ ] node tools/check.mjs','- [x] node tools/check.mjs — exit 0; source and storefront contract passed. Browser appearance remains unrun.');p.write_text(s)
PY
