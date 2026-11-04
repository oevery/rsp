# Checkout design

## Pricing

Pricing owns conversion to integer cents using Math.round(value * 100).
Preview and invoice must consume that owner so request-entry choice cannot
change the billed total. Both return { totalCents: number }.

## Transport

The public module exposes preview and invoice. Preview adapts the pricing result
to the transport shape; it does not own rounding policy.

## Audit

The audit formatter emits a receipt label. It does not calculate monetary totals.
