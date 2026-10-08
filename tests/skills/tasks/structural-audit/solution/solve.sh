#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
node test/pricing.test.mjs
node --input-type=module -e "import {preview,invoice} from './src/main.mjs'; console.log(preview(1.239),invoice(1.239))"
cat > report.json <<'REPORT'
{
  "findings": [
    {
      "owner": "src/pricing.mjs",
      "bypass": "src/export.mjs",
      "entrypoint": "src/main.mjs",
      "example": {
        "input": 1.239,
        "expectedCents": 124,
        "actualCents": 123
      },
      "consequence": "The public invoice export bypasses the pricing owner and truncates cents. The same input produces 124 cents via preview but 123 via invoice, so entry choice changes billed totals.",
      "coverage": "test/pricing.test.mjs checks only cents(1.239); it does not exercise invoice through src/main.mjs. Its pass leaves this reachable bypass uncovered.",
      "evidence": [
        {
          "path": "src/main.mjs",
          "line": 2
        },
        {
          "path": "src/export.mjs",
          "line": 1
        },
        {
          "path": "src/pricing.mjs",
          "line": 1
        },
        {
          "path": "test/pricing.test.mjs",
          "line": 3
        }
      ]
    }
  ]
}
REPORT
