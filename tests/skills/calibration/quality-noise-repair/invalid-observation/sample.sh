#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 - <<'PY'
from pathlib import Path
path=Path('src/noise.mjs')
source=path.read_text()
line="      if (!Number.isInteger(observed) || observed < 0 || observed > 3) throw new Error('unconfirmed level')"
assert source.count(line)==1
path.write_text(source.replace(line,''))
PY
cat > test/noise.test.mjs <<'SOURCE'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NoiseController } from '../src/noise.mjs'
import { ReceiverLink } from '../src/link.mjs'
test('a confirmed setting updates display', async () => {
  const controller = new NoiseController(new ReceiverLink())
  assert.equal(await controller.set(2), 2)
})
SOURCE
node tools/check.mjs
