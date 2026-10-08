#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node --input-type=module -e "import assert from 'node:assert/strict'; import {requested} from './src/requested.mjs'; assert.equal(requested,true)"
python3 - <<'PY'
from pathlib import Path
p=Path('.rsp/changes/requested-export.md');s=p.read_text().replace('- [ ] Verify the actual export.','- [x] Verify the actual export.').replace('- [ ] Verify requested=true by importing src/requested.mjs with Node.', '- [x] Verify requested=true by importing src/requested.mjs with Node. Command: node --input-type=module -e (import requested from the actual src/requested.mjs and assert strict equality to true). Exit 0. The optional helper was absent; direct actual-module verification satisfies the same boundary. Manual consumer check remains unrun.');p.write_text(s)
PY
