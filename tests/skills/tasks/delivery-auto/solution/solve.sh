#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
"${RSP_CLI:-rsp}" ready value-change --json
"${RSP_CLI:-rsp}" archive value-change
cat > report.json <<'JSON'
{"closure":"archived","commit":false,"evidence":"reused","reason":"Current setup evidence matches relevant inputs; configured delivery boundary applied."}
JSON
