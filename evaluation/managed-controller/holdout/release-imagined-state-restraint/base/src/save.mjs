export function saveReady(record) {
  return { ...record, persisted: true }
}
