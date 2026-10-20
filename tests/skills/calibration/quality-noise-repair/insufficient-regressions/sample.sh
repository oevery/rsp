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
node tools/check.mjs
