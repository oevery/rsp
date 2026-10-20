export class NoiseController {
  level = null
  tail = Promise.resolve()
  uncertain = false
  constructor(link) { this.link = link }
  set(level) {
    const operation = this.tail.then(async () => {
      if (this.uncertain)
        throw new Error('refresh required')
      if (!Number.isInteger(level) || level < 0 || level > 3)
        throw new RangeError('invalid level')
      try {
        await this.link.write(level)
        const observed = await this.link.read()
        if (observed !== level)
          throw new Error('unconfirmed level')
        this.level = observed
        return observed
      }
      catch (error) {
        if (error.code === 'timeout')
          this.uncertain = true
        throw error
      }
    })
    this.tail = operation.catch(() => {})
    return operation
  }

  async refresh() {
    const operation = this.tail.then(async () => {
      if (this.uncertain)
        await Promise.resolve()
      const observed = await this.link.read()
      if (!Number.isInteger(observed) || observed < 0 || observed > 3)
        throw new Error('unconfirmed level')
      this.level = observed
      this.uncertain = false
      return observed
    })
    this.tail = operation.catch(() => {})
    return operation
  }
}
