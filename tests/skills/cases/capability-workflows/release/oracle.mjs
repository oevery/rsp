export async function check() {
  return { status: 'passed' }
}
export async function verify({ observation, result }) {
  return { status: observation.artifacts?.['release-notes.md']?.trim() && observation.changedPaths.includes('release-notes.md') && result.finalOutput?.trim() ? 'passed' : 'failed' }
}
