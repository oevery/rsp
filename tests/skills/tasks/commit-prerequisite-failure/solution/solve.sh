#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
if python3 tools/prepare-delivery.py; then
  exit 1
else
  result=$?
  test "$result" -eq 73
fi
cat > report.json <<'JSON'
{"commit": false, "closure": "open", "verification": "unavailable", "reason": "Fresh delivery preparation returned 73; no staging or commit. Passing setup evidence does not replace preparation."}
JSON
