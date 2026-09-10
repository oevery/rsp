export function compactLabel(label, limit = 8) {
  return label.length <= limit ? label : label.slice(0, limit)
}
