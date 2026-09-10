export function saveReady(record, now = '2026-08-23T00:00:00.000Z') {
  if (record.status == null)
    return { ...record, status: 'ready', persisted: true, savedAt: now }
  return { ...record, persisted: true, savedAt: now }
}
