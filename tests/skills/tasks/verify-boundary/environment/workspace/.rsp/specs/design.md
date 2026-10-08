# Checkout contracts

## Purpose
Produce tenant-scoped integer-cent checkout summaries.

## Contracts
Round a discounted line half up once after multiplying quantity. Shipping uses discounted subtotal; the threshold includes exactly 2000 cents. Preserve the tenant and do not mutate input arrays.
