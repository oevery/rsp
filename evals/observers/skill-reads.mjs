import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { hash } from '../runner/files.mjs'

function outputLines(output) {
  return stripVTControlCharacters(output).split(/\r?\n/u).map((line) => {
    const text = line.trim()
    // Preserve the original as well: numeric prefixes can be actual content.
    // These are display encodings (rg and nl), not Skill prose assertions.
    return [text, text.replace(/^(?:(?:.*?:)?\d+[:-]|\d+\t)/u, '').trim()]
  })
}

export function knownOutputReference(observation, composition, skills) {
  const sources = [...Object.values(observation.artifacts), observation.status, observation.diff, ...skills.map(skill => readFileSync(join(composition, skill, 'SKILL.md'), 'utf8'))]
  return [...new Set(sources.flatMap(source => source.split(/\r?\n/u).map(line => hash(line.trim()))))]
}

export function isKnownOutput(output, reference) {
  if (typeof output !== 'string')
    return false
  const known = new Set(reference ?? [])
  return outputLines(output).every(variants => variants[0] === '' || variants.some(line => known.has(hash(line))))
}

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

export function observeGuidance(output, reference) {
  if (typeof output !== 'string')
    return { exposed: [], partial: false }
  const lines = new Set(outputLines(output).flat().map(hash))
  const matches = Object.entries(reference ?? {}).map(([skill, signatures]) => ({ skill, count: signatures.filter(signature => lines.has(signature)).length }))
  return { exposed: matches.filter(item => item.count >= 2).map(item => item.skill), partial: matches.some(item => item.count === 1) }
}
