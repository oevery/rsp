#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node tools/check-transport.mjs || test "$?" -eq 78
python3 - <<'PY2'
import json
from pathlib import Path
Path('report.json').write_text(json.dumps({'findings':[{'path':'migration.md','reason':'DELETE without WHERE removes non-expired rows as well.'}],'coverage':[{'path':'src/transport.mjs','status':'blocked','reason':'Vendor error shape and runtime unavailable; timeout mapping cannot be established.'},{'path':'migration.md','status':'issues_found','reason':'Unconditional deletion contradicts retention.'},{'path':'draft-plan.md','status':'clean','reason':'Deferred batch size is clearly labeled and outside scope.'}]}))
PY2
