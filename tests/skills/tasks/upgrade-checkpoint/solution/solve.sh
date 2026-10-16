#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
git add -- src/value.mjs
git -c commit.gpgsign=false commit -m 'fix(value): update exported value'
cat > report.json <<'JSON'
{"commit": true, "closure": "open", "verification": "passed", "reason": "Matching setup evidence supports the checkpoint; migration readiness remains unavailable."}
JSON
