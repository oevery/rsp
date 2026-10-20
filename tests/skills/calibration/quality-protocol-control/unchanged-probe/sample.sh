#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node --input-type=module <<'JS'
import assert from 'node:assert/strict'
import { ReceiverSession } from './src/session.mjs'

const sent = []
const session = new ReceiverSession('R-A', { send: packet => sent.push(packet) })
session.register({ id: 'a', model: 'H-A' })
session.register({ id: 'b', model: 'H-B' })
assert.throws(() => session.send(['a', 'b', 'missing'], 'hello'))
assert.deepEqual(sent, [])
console.log('Unknown targets reject before sending to any registered target.')
JS
python3 - <<'PY'
import json
from pathlib import Path

path = Path('assessment.json')
report = json.loads(path.read_text())
report['evidence'].append({'path': 'src/session.mjs', 'detail': 'An inline Node assertion using the real session and codecs rejected an unknown target after valid alpha and beta IDs and observed zero packets. The probe was not retained as a permanent test.'})
report['limits'] = 'Source and existing tests are unchanged. The additional probe establishes current local behavior, not permanent regression protection or physical hardware acceptance.'
path.write_text(json.dumps(report, indent=2) + '\n')
PY
node tools/check.mjs
