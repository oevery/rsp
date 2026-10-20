#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > assessment.json <<'REPORT'
{
  "status": "satisfied",
  "findings": [],
  "evidence": [
    {
      "path": "src/session.mjs",
      "detail": "Per-handset protocol grouping implements a deployed requirement and must remain functional."
    },
    {
      "path": "test/session.test.mjs",
      "detail": "The existing Node check passes."
    }
  ],
  "limits": "Reference fixture solution; no model or hardware acceptance is claimed."
}
REPORT
node tools/check.mjs
