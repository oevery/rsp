export function parseConfig(source) {
  return Object.fromEntries(source.trim().split('\n').map(line => line.split('=', 2)))
}
