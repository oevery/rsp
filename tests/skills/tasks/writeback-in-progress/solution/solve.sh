#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY2'
from pathlib import Path
import json
Path('.rsp/specs/design.md').write_text('# Value architecture'+chr(10)+'The module exports value 2.'+chr(10))
Path('report.json').write_text(json.dumps({'closure':'open','remainingWork':'consumer integration'}))
PY2
