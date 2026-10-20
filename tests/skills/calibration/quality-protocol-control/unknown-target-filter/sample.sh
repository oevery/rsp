#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path

path = Path('src/session.mjs')
source = path.read_text()
guard = "    if (ids.some(id => !this.handsets.has(id))) throw new Error('unknown target')\n"
loop = '    for (const id of ids) {\n'
assert source.count(guard) == 1 and source.count(loop) == 1
source = source.replace(guard, '').replace(loop, loop + '      if (!this.handsets.has(id)) continue\n')
path.write_text(source)
path = Path('assessment.json')
report = json.loads(path.read_text())
report['status'] = 'corrected'
report['findings'] = [{'path': 'src/session.mjs', 'reason': 'send now skips unregistered IDs.', 'consequence': 'Registered targets still receive packets from a request containing unknown IDs.'}]
report['evidence'][0]['detail'] = 'The source filters unknown IDs while retaining protocol grouping for registered IDs.'
report['limits'] = 'Only the existing retained tests were run; they do not exercise unknown-target requests. No hardware acceptance is claimed.'
path.write_text(json.dumps(report, indent=2) + '\n')
PY
node tools/check.mjs
