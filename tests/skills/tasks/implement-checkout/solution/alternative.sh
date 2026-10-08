#!/usr/bin/env bash
set -euo pipefail
# Independently authored local calibration solution.
cd "$RSP_WORKSPACE"
cat > src/pricing.mjs <<'EOF'
export function lineTotal(line) {
  const gross = line.unitCents * line.quantity
  const discounted = gross * (1 - line.discountPercent / 100)
  return Math.round(discounted)
}
EOF
cat > src/checkout.mjs <<'EOF'
import { lineTotal } from './pricing.mjs'
export function checkout(tenant, lines) {
  let subtotalCents = 0
  for (const line of lines) subtotalCents += lineTotal(line)
  const shippingCents = subtotalCents < 2000 ? 250 : 0
  return { tenant, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}
EOF
node tools/check.mjs
