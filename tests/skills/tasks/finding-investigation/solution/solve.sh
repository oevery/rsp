#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
Path('report.json').write_text(json.dumps({'dispositions': [{'id': 'F1', 'status': 'accepted', 'reason': 'README promises replacement but export.mjs uses exclusive wx creation and exits 3 on EEXIST, preserving bytes. The claim requires a future authorized documentation correction.'}, {'id': 'F2', 'status': 'rejected', 'reason': 'export.mjs already accepts explicit EXPORT_TENANT. It exits 2 when absent. A hardcoded tenant fallback would violate explicit tenant selection.'}], 'repaired': False, 'evidence': [{'path': 'export.mjs', 'detail': 'Explicit process.env.EXPORT_TENANT, exclusive wx creation and EEXIST exit 3 contradict the proposed fallback and overwrite promise.'}, {'path': 'project-brief.md', 'detail': 'The local contract requires an explicit tenant, preservation of existing output and no automatic successful replay.'}]},indent=2)+'\n')
PY
