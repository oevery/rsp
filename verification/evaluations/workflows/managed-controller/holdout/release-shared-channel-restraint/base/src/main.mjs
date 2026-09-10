export function registerSidebar(ipc, close) {
  ipc.on('sidebar:close', close)
}
