#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > assessment.json <<'REPORT'
{
  "status": "satisfied",
  "findings": [],
  "evidence": [
    {
      "path": "src/noise.mjs",
      "detail": "Whole-transaction serialization and explicit recovery are correct. Keep late-ACK protection and independently valuable transaction/recovery tests."
    },
    {
      "path": "test/noise.test.mjs",
      "detail": "The existing Node check passes."
    }
  ],
  "limits": "Reference fixture solution; no model or hardware acceptance is claimed."
}
REPORT
node tools/check.mjs
