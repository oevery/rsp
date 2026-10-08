#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > plan.md <<'EOF'
# TTL design
Keep a single cache owner in src/cache.mjs and inject an integer millisecond clock. Preserve string keys and values. Store expiresAt with each entry. Install the new value before validating TTL and throw for negative input afterwards. An entry is expired only when now > expiresAt; equality still returns the value, including TTL zero. Deterministic tests check a value at 109 and 110 and expiry at 111 for creation at 100 with TTL 10. Implementation and execution are pending; no source changes are authorized.
EOF
