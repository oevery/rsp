export function saveReady(record, now = '2026-08-23T00:00:00.000Z') {
  return { ...record, persisted: true, savedAt: now }
}
