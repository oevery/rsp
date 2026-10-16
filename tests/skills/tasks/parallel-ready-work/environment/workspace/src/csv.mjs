export function encodeField(value) {
  const text = value == null ? '' : String(value)
  return text.includes(',') ? `"${text}"` : text
}

export function exportRows(rows) {
  return rows.map(row => row.map(encodeField).join(',')).join('\n')
}
