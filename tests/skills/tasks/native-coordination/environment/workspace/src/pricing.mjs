export function lineTotal({ unitCents, quantity, discountPercent }) {
  return Math.trunc(unitCents * quantity * (100 - discountPercent) / 100)
}
