#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node tools/check.mjs
cat > report.json <<'REPORT'
{
  "workRef": "catalog-refresh",
  "state": "blocked",
  "next": "ask-owner",
  "selectedPriceCents": null,
  "question": "Should Notebook cost 1500 or 1800 cents? Neither is approved; please choose before implementation.",
  "currentCheck": {
    "command": "node tools/check.mjs",
    "status": "passed",
    "scope": "current-snapshot-only"
  },
  "explanation": "The focused Change leaves price selection to the owner and blocks implementation. The check passed for current 1200-cent source and 12.00 USD storefront; it has no expectations for either future price. No approval or completion is established. After an owner decision, implementation and decision-aligned verification can proceed under that authority."
}
REPORT
