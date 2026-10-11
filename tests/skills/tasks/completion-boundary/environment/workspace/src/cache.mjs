export function createCache(clock) {
  const entries = new Map()
  return {
    set(key, value, ttlMs) {
      if (!Number.isInteger(ttlMs) || ttlMs < 0)
        throw new RangeError('TTL must be a nonnegative integer')
      entries.set(key, { value, expiresAt: clock() + ttlMs })
    },
    get(key) {
      const entry = entries.get(key)
      if (!entry)
        return undefined
      if (clock() > entry.expiresAt) {
        entries.delete(key)
        return undefined
      }
      return entry.value
    },
  }
}
