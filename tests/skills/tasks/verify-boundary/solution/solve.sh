#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import subprocess,json
from pathlib import Path
checks=[]
for path in ['tools/check.mjs','tools/external-check.mjs']:
 p=subprocess.run(['node',path],capture_output=True,text=True)
 checks.append({'command':'node '+path,'status':'unavailable' if p.returncode==78 else 'failed' if p.returncode else 'passed','exitCode':p.returncode})
Path('report.json').write_text(json.dumps({'workRef':'checkout-correction','complete':False,'checks':checks,'evidence':[{'path':'src/pricing.mjs','detail':'The local check fails: Math.trunc yields 50 for 101 cents at 50%, while nearest rounding requires 51.'},{'path':'tools/external-check.mjs','detail':'The command exits 78 because an accepted provider snapshot is unavailable. Both Required gates remain incomplete.'}]},indent=2)+chr(10))
PY
