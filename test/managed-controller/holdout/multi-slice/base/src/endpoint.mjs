export function parseEndpoint(value) {
  const [host, port] = value.split(':')
  return { host, port }
}

export function formatEndpoint(endpoint) {
  return `${endpoint.host}:${endpoint.port}`
}
