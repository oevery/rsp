import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash } from '../runner/files.mjs'

// Retain fingerprints, not guidance text, for deterministic offline replay.
// Shared boilerplate cannot identify which Skill was exposed to the agent.
export function skillReadReference(composition, skills) {
  const lines = Object.fromEntries(skills.map(skill => [skill, [...new Set(readFileSync(join(composition, skill, 'SKILL.md'), 'utf8').split(/\r?\n/u).map(line => line.trim()).filter(line => line.length >= 32).map(hash))]]))
  const owners = new Map()
  for (const values of Object.values(lines)) {
    for (const value of values)
      owners.set(value, (owners.get(value) ?? 0) + 1)
  }
  return Object.fromEntries(Object.entries(lines).map(([skill, values]) => [skill, values.filter(value => owners.get(value) === 1)]))
}

export function exposedSkills(output, reference) {
  if (typeof output !== 'string')
    return []
  const lines = new Set(output.split(/\r?\n/u).flatMap((line) => {
    const text = line.trim()
    // rg -n output may include a filename and a line number.
    return [text, text.replace(/^(?:.*?:)?\d+[:-]/u, '').trim()]
  }).map(hash))
  return Object.entries(reference ?? {}).filter(([, signatures]) => signatures.filter(signature => lines.has(signature)).length >= 2).map(([skill]) => skill)
}
