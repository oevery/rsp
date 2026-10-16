#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > report.json <<'JSON'
{"commit": false, "closure": "open", "verification": "unavailable", "reason": "Required setup evidence unavailable; no Git mutation."}
JSON
