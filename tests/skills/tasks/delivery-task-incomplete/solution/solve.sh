#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
git add -- src/value.mjs
git -c commit.gpgsign=false commit -m 'fix(value): update exported value'
cat > report.json <<'JSON'
{"closure":"open","commit":true,"evidence":"reused","reason":"Current setup evidence matches relevant inputs; configured delivery boundary applied."}
JSON
