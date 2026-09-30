export function lineTotal({ unitCents, quantity, discountPercent }) {
  return Math.round(unitCents * quantity * (100 - discountPercent) / 100)
}
