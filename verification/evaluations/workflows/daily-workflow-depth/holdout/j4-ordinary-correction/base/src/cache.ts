const values = new Map<string, string>()

export function putCachedValue(classId: string, type: string, value: string) {
  values.set(type, value)
}

export function getCachedValue(classId: string, type: string) {
  return values.get(type)
}

export function clearCache() {
  values.clear()
}
