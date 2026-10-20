export class NoiseController {
  level = null
  tail = Promise.resolve()
  constructor(link) { this.link = link }
  set(level) {
    const ack = this.tail.then(() => this.link.write(level))
    this.tail = ack.catch(() => {})
    return ack.then(async () => {
      const observed = await this.link.read()
      if (observed !== level) throw new Error('unconfirmed level')
      this.level = observed
      return observed
    })
  }
  async refresh() { this.level = await this.link.read(); return this.level }
}
