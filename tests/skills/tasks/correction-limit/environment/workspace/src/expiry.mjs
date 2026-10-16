export function visibleRecords(records, now) {
  return records.filter(record => record.expiresAt == null || now <= Number(record.expiresAt))
}
