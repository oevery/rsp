export function receiverProtocol(model) {
  if (model === 'R-A') return 'alpha'
  if (model === 'R-B') return 'beta'
  throw new Error('unsupported receiver')
}
export function encode(protocol, targets, text) {
  return { protocol, targets: [...targets], text: protocol === 'alpha' ? text : text.toUpperCase() }
}
