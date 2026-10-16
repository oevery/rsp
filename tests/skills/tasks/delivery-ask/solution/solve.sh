#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > report.json <<'JSON'
{"closure":"pending","commit":false,"evidence":"reused","reason":"Current setup evidence matches relevant inputs; configured delivery boundary applied."}
JSON
