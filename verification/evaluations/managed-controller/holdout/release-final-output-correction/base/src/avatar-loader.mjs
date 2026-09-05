export function createAvatarLoader(fetchAvatar) {
  return async function loadAvatar(userId) {
    return fetchAvatar(userId)
  }
}
