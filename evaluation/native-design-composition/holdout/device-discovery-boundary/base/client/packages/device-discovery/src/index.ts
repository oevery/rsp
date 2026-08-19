export function projectDeviceEvent(input: { connected: boolean, id: string }) {
  return { connected: input.connected, id: input.id }
}
