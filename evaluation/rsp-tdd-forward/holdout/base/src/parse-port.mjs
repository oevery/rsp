export function parsePort(input) {
  if (!/^\d+$/.test(input))
    return null

  const value = Number(input)
  return Number.isInteger(value) && value <= 65535 ? value : null
}
