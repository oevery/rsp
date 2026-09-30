export async function check() {
  return { status: 'passed' }
}
export async function verify({ observation, result }) {
  const missing = ['CONTEXT.md', 'README.md'].filter(path => !observation.artifacts?.[path]?.trim())
  const retired = !Object.hasOwn(observation.files, 'CONTEXT-MAP.md')
  return { status: result.exitCode === 0 && result.finalOutput?.trim() && retired && missing.length === 0 ? 'passed' : 'failed', evidence: { missing, retired, meaning: 'requires-independent-review' } }
}
