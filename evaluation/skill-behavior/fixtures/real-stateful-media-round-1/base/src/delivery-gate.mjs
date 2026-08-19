export function canDeliver(record) {
  return record?.state === 'ready'
}
