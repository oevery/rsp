const users = new Map()

export async function readUser(tenantId, userId, load) {
  if (users.has(userId))
    return users.get(userId)

  const user = await load(tenantId, userId)
  users.set(userId, user)
  return user
}

export function resetUsers() {
  users.clear()
}
