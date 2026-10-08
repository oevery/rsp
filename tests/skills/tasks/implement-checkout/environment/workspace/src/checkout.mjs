import { lineTotal } from "./pricing.mjs"

export function checkout(tenant, lines) {
  const subtotalCents = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const gross = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0)
  const shippingCents = gross >= 2000 ? 0 : 250
  return { tenant, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}
