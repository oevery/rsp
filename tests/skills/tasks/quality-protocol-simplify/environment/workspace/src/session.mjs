import { encode, receiverProtocol } from './codecs.mjs'
export class ReceiverSession {
  handsets = new Map()
  constructor(model, wire) { this.protocol = receiverProtocol(model); this.wire = wire }
  register(handset) {
    this.handsets.set(handset.id, { ...handset, protocol: handset.model === 'H-B' ? 'beta' : this.protocol })
  }
  send(targets, text) {
    const ids = targets ?? [...this.handsets.keys()]
    if (ids.some(id => !this.handsets.has(id))) throw new Error('unknown target')
    const groups = new Map()
    for (const id of ids) {
      const protocol = this.handsets.get(id).protocol
      const group = groups.get(protocol) ?? []
      group.push(id)
      groups.set(protocol, group)
    }
    const packets = [...groups].map(([protocol, group]) => encode(protocol, group, text))
    for (const packet of packets) this.wire.send(packet)
    return packets
  }
}
