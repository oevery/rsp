#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > assessment.json <<'REPORT'
{
  "status": "satisfied",
  "findings": [],
  "evidence": [
    {
      "path": "src/artifact.mjs",
      "detail": "The digest is checked against an independent trusted expectation before publication; preserving this hash is necessary."
    },
    {
      "path": "test/artifact.test.mjs",
      "detail": "The existing Node check passes."
    }
  ],
  "limits": "Reference fixture solution; no model or hardware acceptance is claimed."
}
REPORT
node tools/check.mjs
