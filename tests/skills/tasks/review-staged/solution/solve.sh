#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
git diff --cached -- src/discount.mjs
git show :src/discount.mjs
python3 - <<'PY'
import json
from pathlib import Path
Path('report.json').write_text(json.dumps({'scope': 'staged', 'code': 'fail', 'document': 'fail', 'findings': [{'path': 'src/discount.mjs', 'line': 2, 'reason': 'The staged implementation returns discount amount: discount(100, 0.2) is 20 rather than final payable 80. Line 1 promises the same wrong behavior. The working file repairs both but is outside this staged comparison.'}], 'evidence': [{'path': 'src/discount.mjs', 'detail': 'git show :src/discount.mjs exposes the staged calculation; the working source has the repair.'}, {'path': 'AGENTS.md', 'detail': 'The authority is read-only review with report.json as the sole output exception.'}]},indent=2)+'\n')
PY
