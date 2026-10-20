export function latch() {
  let release
  const promise = new Promise(resolve => { release = resolve })
  return { promise, release }
}
export class ReceiverLink {
  epoch = 1
  actual = 0
  writes = []
  uncertain = false
  failWrite = false
  ackGate = null
  readGate = null
  readStarted = null
  async write(level) {
    this.writes.push({ epoch: this.epoch, level })
    if (this.uncertain) throw Object.assign(new Error('ambiguous ACK'), { code: 'timeout' })
    if (this.ackGate) await this.ackGate.promise
    this.actual = level
    if (this.failWrite) {
      this.failWrite = false
      this.uncertain = true
      throw Object.assign(new Error('ACK timeout'), { code: 'timeout' })
    }
  }
  async read() {
    const observed = this.actual
    this.readStarted?.release()
    if (this.readGate) await this.readGate.promise
    return observed
  }
  async reconnect() { this.epoch++; this.uncertain = false }
}
