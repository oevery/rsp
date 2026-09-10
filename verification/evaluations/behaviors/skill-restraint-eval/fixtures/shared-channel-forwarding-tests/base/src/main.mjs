import { CLOSE_SIDEBAR_CHANNEL } from './channels.mjs'

export function sendCloseSidebar(transport) {
  transport.send(CLOSE_SIDEBAR_CHANNEL)
}
