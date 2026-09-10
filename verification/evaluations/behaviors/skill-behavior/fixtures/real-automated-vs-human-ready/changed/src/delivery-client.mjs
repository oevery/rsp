export class DeliveryClient {
  constructor({ controlPlane, uploader }) {
    this.controlPlane = controlPlane
    this.uploader = uploader
  }

  async deliver(request) {
    const intent = await this.controlPlane.createIntent(request)
    const upload = {
      body: request.body,
      headers: { ...intent.uploadHeaders },
      url: intent.uploadUrl,
    }

    await this.uploader.upload(upload)
    return this.controlPlane.complete(intent.objectId)
  }
}
