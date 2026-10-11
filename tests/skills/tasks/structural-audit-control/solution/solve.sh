#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node test/pricing.test.mjs
cat > report.json <<'REPORT'
{"verdict":"clean","findings":[],"coverage":"Inspected main, route, export and pricing. Both production paths use cents. Existing tests cover cents but not the complete entry paths; this is a coverage limit, not an evidenced structural defect.","evidence":[{"path":"src/main.mjs","line":1},{"path":"src/export.mjs","line":1},{"path":"src/pricing.mjs","line":1}]}
REPORT
