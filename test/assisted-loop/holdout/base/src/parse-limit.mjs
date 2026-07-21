export function parseLimit(input) {
  const value = Number(input)
  return Number.isInteger(value) && value >= 1 && value <= 100 ? value : null
}
