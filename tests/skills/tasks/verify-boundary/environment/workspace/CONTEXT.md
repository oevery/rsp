# Checkout domain
Pricing owns integer-cent line amounts. Checkout owns discount-aware shipping and summary output. Tests are immutable acceptance inputs, not implementation targets. Prices use half-up rounding per line, not truncation. Shipping is free when the discounted subtotal is at least 2000 cents, otherwise 250 cents. Each request retains its tenant identifier.
