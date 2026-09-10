import { CHANNEL } from './channels.mjs'

export function createBridge(ipc) {
  return { closeSidebar: () => ipc.send(CHANNEL) }
}
