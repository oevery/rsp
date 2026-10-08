#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > plan.md <<'EOF'
# Cache TTL plan

The approved design belongs to src/cache.mjs. Implementation and runtime behavior are not yet verified. The cache remains process-local with string keys and immutable string values.

1. Inject a clock returning integer milliseconds, defaulting to Date.now. Store value and expiresAt per entry. Keep expiry in this one owner.
2. On write validate integer TTL >= 0 before changing an entry; reject negative or fractional TTL. Set expiresAt = clock() + ttl. Zero expires immediately.
3. On read return undefined if absent or clock() >= expiresAt; otherwise return the value. An expired entry may be removed but must never be returned.
4. Test without sleeping using a controllable clock: time 100, TTL 10 returns value at 109 and undefined at 110 and 111. TTL 0 returns undefined immediately. Negative TTL throws without overwriting a prior value. Separate keys expire independently; overwriting a key starts its new TTL.

Acceptance requires these public API outcomes, preserved strings and missing-key behavior. No timers, persistence or distributed service is needed. A later authorized implementation runs tests. This design grants no product mutation, lifecycle closeout or Git delivery.
EOF
