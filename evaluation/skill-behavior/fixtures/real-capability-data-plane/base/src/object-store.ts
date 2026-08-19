export interface ObjectTransport {
  send(request: {
    url: string
    headers: Record<string, string>
    bytes: Uint8Array
  }): Promise<void>
}

export async function uploadBytes(
  transport: ObjectTransport,
  url: string,
  bytes: Uint8Array,
) {
  await transport.send({ url, headers: {}, bytes })
}
