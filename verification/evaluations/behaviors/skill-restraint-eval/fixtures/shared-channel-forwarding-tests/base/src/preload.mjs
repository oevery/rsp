import { sendCloseSidebar } from './main.mjs'

export function createBridge(transport) {
  return {
    closeSidebar() {
      sendCloseSidebar(transport)
    },
  }
}
