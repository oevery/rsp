export function normalizeMediaUrl(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      return null
    return url.href
  }
  catch {
    return null
  }
}

export function canDeliver(record) {
  return record?.state === 'ready' && normalizeMediaUrl(record.url) !== null
}
