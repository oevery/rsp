#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > report.json <<'JSON'
{
  "cases": [
    {
      "id": "parameter",
      "route": "direct",
      "owner": null,
      "reason": "Bounded optional parameter and known caller preserve existing semantics."
    },
    {
      "id": "dependencies",
      "route": "direct",
      "owner": null,
      "reason": "Compatible maintenance with checks and no separate rollout obligations."
    },
    {
      "id": "diagram",
      "route": "direct",
      "owner": null,
      "reason": "Correct existing facts; multiple sessions and browser checks do not create implementation contracts."
    },
    {
      "id": "coupled",
      "route": "change",
      "owner": null,
      "reason": "Related ownership and lifecycle contracts require joint implementation and fixture acceptance, not independent slices."
    },
    {
      "id": "existing",
      "route": "existing",
      "owner": "assessment/session",
      "reason": "Same outcome and remaining acceptance already belong to assessment/session."
    },
    {
      "id": "overlap",
      "route": "direct",
      "owner": null,
      "reason": "Shared file does not make a documentation typo part of runtime migration."
    },
    {
      "id": "advice",
      "route": "advice",
      "owner": null,
      "reason": "Read-only review grants no implementation or record creation authority."
    },
    {
      "id": "staged",
      "route": "change",
      "owner": null,
      "reason": "Actual client acceptance and delayed removal need persistent rollout tracking."
    }
  ]
}
JSON
