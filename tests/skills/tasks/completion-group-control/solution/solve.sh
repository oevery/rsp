#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node tools/check.mjs
node --input-type=module <<'JS'
import { createCache } from './src/cache.mjs'
let now = 100
const cache = createCache(() => now)
cache.set('item', 'value', 10)
now = 110
console.log('at deadline:', cache.get('item'))
cache.set('zero', 'immediate', 0)
console.log('zero TTL:', cache.get('zero'))
JS
cat > report.json <<'REPORT'
{
  "workRef": "checkout/cache-ttl",
  "completionSupported": true,
  "declaredCheck": {
    "command": "node tools/check.mjs",
    "status": "passed",
    "exitCode": 0
  },
  "findings": [],
  "evidence": [
    {
      "path": ".rsp/specs/cache.md",
      "detail": "Expiry includes equality, zero is immediate, invalid TTL rejects before mutation, and expired reads remove entries."
    },
    {
      "path": "src/cache.mjs",
      "detail": "The >= guard deletes and returns undefined at equality, including zero TTL; validation precedes mutation and each factory owns a separate map."
    },
    {
      "path": "tools/check.mjs",
      "detail": "The executed smoke check passes; it checks unexpired reads, replacement and missing keys, not the expiry deadline or zero TTL."
    }
  ],
  "limits": "This is a read-only assessment of the current settled implementation. The smoke check covers only its exercised cases; boundary reasoning was supplemented by a targeted probe. No archive, commit, publication or human approval is inferred."
}
REPORT
