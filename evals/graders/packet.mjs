import { randomUUID } from 'node:crypto'
import { hash } from '../runner/files.mjs'

export function createReviewPacket({ prompt, observation, result, rubric, events, workspace }) {
  const visible = path => !path.startsWith('.agents/') && !path.startsWith('.codex/') && !path.startsWith('.tooling/')
  const files = values => Object.fromEntries(Object.entries(values ?? {}).filter(([path]) => visible(path)))
  const scrub = (text) => {
    let value = String(text ?? '')
    if (workspace)
      value = value.split(workspace).join('[workspace]')
    return value.replace(/(?:[^\s"']*\/)?\.agents\/skills\/[^\s"'`]+/gu, '[private guidance]')
  }
  const commands = events.commands.filter(item => !/\.agents\/skills|SKILL\.md/u.test(item.command)).map(item => ({ ...item, command: scrub(item.command) }))
  const diff = observation.diff.split(/(?=^diff --git )/mu).filter(chunk => !/^diff --git .*\.(?:agents|codex)\//u.test(chunk)).join('')
  const scrubValue = (value) => {
    if (typeof value === 'string')
      return scrub(value)
    if (Array.isArray(value))
      return value.map(scrubValue)
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubValue(item)]))
    return value
  }
  const unchanged = (before, after) => typeof before === 'string' && before.length > 0 && typeof after === 'string' && after.length > 0 ? before === after : null
  const packet = {
    schema: 'semantic-review-v2',
    id: randomUUID(),
    prompt,
    rubric,
    evidence: {
      changedPaths: observation.changedPaths.filter(visible),
      diff: scrub(diff),
      files: files(observation.files),
      baseline: files(observation.baseline),
      artifacts: Object.fromEntries(Object.entries(files(observation.artifacts)).map(([path, content]) => [path, scrub(content)])),
      omittedArtifacts: (observation.omittedArtifacts ?? []).filter(visible),
      finalOutput: scrub(result.finalOutput),
      commands,
      writes: events.writes.filter(visible),
      // Observable host facts, not cached verdicts. Do not expose Git hashes:
      // the index/commit may include the private installed Skill composition.
      hostGit: {
        headUnchanged: unchanged(observation.baselineHead, observation.head),
        indexUnchanged: unchanged(observation.baselineIndexHash, observation.indexHash),
      },
      projectChecks: scrubValue(observation.checks ?? {}),
    },
  }
  // Raw guidance/activation traces stay in the operator bundle, not blind packets.
  // Behavioral differences and free-form answers may still permit inference.
  return { ...packet, packetHash: hash(packet) }
}
