#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > test/noise.test.mjs <<'SOURCE'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NoiseController } from '../src/noise.mjs'
import { ReceiverLink } from '../src/link.mjs'
test('a confirmed setting updates display', async () => {
  const controller = new NoiseController(new ReceiverLink())
  assert.equal(await controller.set(2), 2)
  assert.equal(controller.level, 2)
})
SOURCE
python3 - <<'PY'
import json
from pathlib import Path

path = Path('assessment.json')
report = json.loads(path.read_text())
report['findings'][0]['reason'] = 'The implementation queues complete settings and reconnect recovery.'
report['findings'][0]['consequence'] = 'Later writes wait for confirmation; recovery does not replay writes.'
report['evidence'][0]['detail'] = 'The retained source queues complete write/readback operations and reconnect recovery.'
report['evidence'][1]['detail'] = 'The retained test checks only one successful confirmed setting and passes.'
report['limits'] = 'No retained concurrency or recovery regression tests remain; the requested durable protection is incomplete. No hardware acceptance is claimed.'
path.write_text(json.dumps(report, indent=2) + '\n')
PY
node tools/check.mjs
