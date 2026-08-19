export function parseConfig(source) {
  return Object.fromEntries(source.trim().split('\n').map((line) => {
    const [key, value] = line.split('=', 2)
    if (!key)
      throw new Error('Config keys must not be blank')
    return [key, value]
  }))
}
