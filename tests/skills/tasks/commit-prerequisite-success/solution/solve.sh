#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
python3 tools/prepare-delivery.py
git add -- src/value.mjs
git -c commit.gpgsign=false commit -m 'fix(value): update exported value'
cat > report.json <<'JSON'
{"commit": true, "closure": "open", "verification": "passed", "reason": "Setup verification matches current inputs and fresh delivery preparation passed; one source-only checkpoint."}
JSON
