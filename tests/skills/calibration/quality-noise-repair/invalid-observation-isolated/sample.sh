#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
import json
from pathlib import Path
import subprocess

path = Path('src/noise.mjs')
source = path.read_text()
guard = "      if (!Number.isInteger(observed) || observed < 0 || observed > 3) throw new Error('unconfirmed level')\n"
assert source.count(guard) == 1
path.write_text(source.replace(guard, ''))
# Keep all retained tests: the publication test should expose the source defect.
result = subprocess.run(['node', 'tools/check.mjs'], text=True,
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
print(result.stdout, end='')
assert result.returncode == 1, 'The source defect must fail the retained check.'
path = Path('assessment.json')
report = json.loads(path.read_text())
report['findings'] = [{'path': 'src/noise.mjs', 'reason': 'Refresh publishes the device observation without checking its range.', 'consequence': 'An invalid recovery observation replaces the confirmed level.'}]
report['evidence'][0]['detail'] = 'Transaction and reconnect recovery paths remain; refresh lacks observation validation.'
report['evidence'][1]['detail'] = 'All eight tests remain. The retained check ran and failed the invalid-observation rejection test; transaction and recovery checks passed.'
report['limits'] = 'The retained suite exposes an unresolved product defect; its failing check is not successful acceptance. No hardware acceptance is claimed.'
path.write_text(json.dumps(report, indent=2) + '\n')
PY
