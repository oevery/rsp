export class DeliveryClient {
  constructor({ controlPlane, uploader }) {
    this.controlPlane = controlPlane
    this.uploader = uploader
  }

  async deliver(request) {
    const intent = await this.controlPlane.createIntent(request)
    await this.uploader.upload(intent)
    return this.controlPlane.complete(intent.objectId)
  }
}
