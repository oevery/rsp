export function inWindow(events, start, end) {
  return events.filter(event => event.at >= start && event.at <= end)
}

export function overlap(left, right) {
  const start = Math.max(left.start, right.start)
  const end = Math.min(left.end, right.end)
  return start <= end ? { start, end } : null
}
