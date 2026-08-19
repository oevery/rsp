export function normalizeMode(env) {
  const raw = env.APP_MODE ?? 'safe'
  return raw.trim().toLowerCase()
}
