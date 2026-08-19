#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

export const SKILL_ROUTING_MANIFEST_VERSION = 1
export const MINIMUM_CASES_PER_OWNER = 3

const stopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'before',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'one',
  'or',
  'the',
  'this',
  'to',
  'use',
  'when',
  'with',
  'without',
])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .replaceAll('-', ' ')
    .split(/[^a-z0-9]+/u)
    .filter(token => token.length > 1 && !stopWords.has(token))
}

function termFrequency(tokens) {
  const counts = new Map()
  for (const token of tokens)
    counts.set(token, (counts.get(token) ?? 0) + 1)
  return counts
}

function vector(tokens, inverseDocumentFrequency) {
  const frequencies = termFrequency(tokens)
  const result = new Map()
  for (const [token, count] of frequencies) {
    const weight = inverseDocumentFrequency.get(token) ?? 0
    if (weight > 0)
      result.set(token, (1 + Math.log(count)) * weight)
  }
  return result
}

function cosine(left, right) {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (const value of left.values())
    leftNorm += value * value
  for (const value of right.values())
    rightNorm += value * value
  for (const [token, value] of left)
    dot += value * (right.get(token) ?? 0)
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm)
}

function queryCoverage(queryTokens, documentTokens, inverseDocumentFrequency) {
  const query = new Set(queryTokens)
  const document = new Set(documentTokens)
  let matched = 0
  let total = 0
  for (const token of query) {
    const weight = inverseDocumentFrequency.get(token) ?? 0
    total += weight
    if (document.has(token))
      matched += weight
  }
  return total === 0 ? 0 : matched / total
}

function rounded(value) {
  return Number(value.toFixed(6))
}

function parseSkill(path, expectedName) {
  const content = readFileSync(path, 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/u)
  if (!match)
    throw new Error(`Skill entrypoint has invalid frontmatter: ${expectedName}/SKILL.md`)
  const frontmatter = parseYaml(match[1])
  if (!isObject(frontmatter) || frontmatter.name !== expectedName)
    throw new Error(`Skill name mismatch: expected ${expectedName}`)
  if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '')
    throw new Error(`Skill description must be a non-empty string: ${expectedName}`)
  return { name: expectedName, description: frontmatter.description.trim() }
}

export function loadPublishedSkillCatalog(root) {
  const directory = join(root, 'skills')
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => parseSkill(join(directory, entry.name, 'SKILL.md'), entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'))
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${label} must be a non-empty string`)
  return value.trim()
}

function caseList(value, kind, catalogNames) {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${kind} must be a non-empty array`)
  const ids = new Set()
  return value.map((item, index) => {
    if (!isObject(item))
      throw new Error(`${kind}[${index}] must be an object`)
    const id = requiredString(item.id, `${kind}[${index}].id`)
    if (ids.has(id))
      throw new Error(`${kind} contains duplicate id: ${id}`)
    ids.add(id)
    const prompt = requiredString(item.prompt, `${kind}.${id}.prompt`)
    const expectedOwner = requiredString(item.expected_owner, `${kind}.${id}.expected_owner`)
    if (!catalogNames.has(expectedOwner))
      throw new Error(`${kind}.${id} names unknown expected owner: ${expectedOwner}`)
    if (kind === 'positive')
      return { id, prompt, expected_owner: expectedOwner }
    const otherKey = kind === 'hard_negative' ? 'excluded_owner' : 'competing_owner'
    const otherOwner = requiredString(item[otherKey], `${kind}.${id}.${otherKey}`)
    if (!catalogNames.has(otherOwner))
      throw new Error(`${kind}.${id} names unknown ${otherKey}: ${otherOwner}`)
    if (otherOwner === expectedOwner)
      throw new Error(`${kind}.${id} must name two distinct owners`)
    return { id, prompt, expected_owner: expectedOwner, [otherKey]: otherOwner }
  })
}

export function loadSkillRoutingManifest(root, catalog = loadPublishedSkillCatalog(root)) {
  const path = join(root, 'evaluation', 'skill-routing', 'cases.yaml')
  const raw = parseYaml(readFileSync(path, 'utf8'))
  if (!isObject(raw))
    throw new Error('skill routing manifest must be an object')
  if (raw.version !== SKILL_ROUTING_MANIFEST_VERSION)
    throw new Error(`skill routing manifest version must be ${SKILL_ROUTING_MANIFEST_VERSION}`)
  if (!Number.isFinite(raw.collision_threshold) || raw.collision_threshold <= 0 || raw.collision_threshold >= 1)
    throw new Error('collision_threshold must be between 0 and 1')
  const catalogNames = new Set(catalog.map(item => item.name))
  if (!Array.isArray(raw.owners) || raw.owners.length === 0)
    throw new Error('owners must be a non-empty array')
  const owners = raw.owners.map((owner, index) => requiredString(owner, `owners[${index}]`))
  if (new Set(owners).size !== owners.length)
    throw new Error('owners must not contain duplicates')
  for (const owner of owners) {
    if (!catalogNames.has(owner))
      throw new Error(`owners names unknown published Skill: ${owner}`)
  }
  const positive = caseList(raw.positive, 'positive', catalogNames)
  const hardNegative = caseList(raw.hard_negative, 'hard_negative', catalogNames)
  const pairwise = caseList(raw.pairwise, 'pairwise', catalogNames)
  const allIds = [...positive, ...hardNegative, ...pairwise].map(item => item.id)
  if (new Set(allIds).size !== allIds.length)
    throw new Error('routing case ids must be unique across all case kinds')
  for (const owner of owners) {
    if (positive.filter(item => item.expected_owner === owner).length < MINIMUM_CASES_PER_OWNER)
      throw new Error(`owner requires at least ${MINIMUM_CASES_PER_OWNER} positive cases: ${owner}`)
    if (hardNegative.filter(item => item.excluded_owner === owner).length < MINIMUM_CASES_PER_OWNER)
      throw new Error(`owner requires at least ${MINIMUM_CASES_PER_OWNER} hard-negative exclusions: ${owner}`)
    if (!pairwise.some(item => item.expected_owner === owner) || !pairwise.some(item => item.competing_owner === owner))
      throw new Error(`owner requires pairwise cases in both expected and competing positions: ${owner}`)
  }
  return {
    version: raw.version,
    collision_threshold: raw.collision_threshold,
    owners,
    positive,
    hard_negative: hardNegative,
    pairwise,
  }
}

function vectorModel(documents) {
  const documentFrequency = new Map()
  for (const tokens of documents) {
    for (const token of new Set(tokens))
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
  }
  const inverseDocumentFrequency = new Map([...documentFrequency].map(([token, count]) => [
    token,
    Math.log((documents.length + 1) / (count + 1)) + 1,
  ]))
  return {
    inverseDocumentFrequency,
    vectors: documents.map(tokens => vector(tokens, inverseDocumentFrequency)),
  }
}

function scoringModel(catalog) {
  const documents = catalog.map(item => tokenize(`${item.name} ${item.description}`))
  const model = vectorModel(documents)
  const skillVectors = new Map(catalog.map((item, index) => [
    item.name,
    model.vectors[index],
  ]))
  const skillTokens = new Map(catalog.map((item, index) => [item.name, documents[index]]))
  return { inverseDocumentFrequency: model.inverseDocumentFrequency, skillTokens, skillVectors }
}

export function rankSkillPrompt(catalog, prompt) {
  const model = scoringModel(catalog)
  const promptTokens = tokenize(prompt)
  const promptVector = vector(promptTokens, model.inverseDocumentFrequency)
  return catalog
    .map((item) => {
      const coverage = queryCoverage(promptTokens, model.skillTokens.get(item.name), model.inverseDocumentFrequency)
      const similarity = cosine(promptVector, model.skillVectors.get(item.name))
      return { name: item.name, score: rounded(coverage * 0.8 + similarity * 0.2) }
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, 'en'))
}

function routingObservation(kind, item, ranking) {
  const observedOwner = ranking[0]?.name ?? null
  const scores = Object.fromEntries(ranking.map(entry => [entry.name, entry.score]))
  const expectedScore = scores[item.expected_owner] ?? 0
  if (kind === 'positive') {
    return {
      id: item.id,
      kind,
      passed: observedOwner === item.expected_owner,
      expected_owner: item.expected_owner,
      observed_owner: observedOwner,
      scores,
      reason: observedOwner === item.expected_owner ? null : 'expected owner did not rank first',
    }
  }
  const otherKey = kind === 'hard_negative' ? 'excluded_owner' : 'competing_owner'
  const otherOwner = item[otherKey]
  const otherScore = scores[otherOwner] ?? 0
  const passed = kind === 'pairwise'
    ? expectedScore > otherScore
    : observedOwner === item.expected_owner && expectedScore > otherScore
  return {
    id: item.id,
    kind,
    passed,
    expected_owner: item.expected_owner,
    observed_owner: observedOwner,
    [otherKey]: otherOwner,
    scores,
    reason: passed
      ? null
      : kind !== 'pairwise' && observedOwner !== item.expected_owner
        ? 'expected owner did not rank first'
        : `expected owner did not outrank ${otherOwner}`,
  }
}

function descriptionCollisions(catalog, threshold) {
  const model = vectorModel(catalog.map(item => tokenize(item.description)))
  const collisions = []
  for (let leftIndex = 0; leftIndex < catalog.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < catalog.length; rightIndex += 1) {
      const left = catalog[leftIndex]
      const right = catalog[rightIndex]
      const score = rounded(cosine(model.vectors[leftIndex], model.vectors[rightIndex]))
      if (score >= threshold)
        collisions.push({ left: left.name, right: right.name, score, threshold })
    }
  }
  return collisions.sort((left, right) => right.score - left.score || left.left.localeCompare(right.left, 'en'))
}

export function evaluateSkillRouting({ catalog, manifest }) {
  const cases = [
    ...manifest.positive.map(item => routingObservation('positive', item, rankSkillPrompt(catalog, item.prompt))),
    ...manifest.hard_negative.map(item => routingObservation('hard_negative', item, rankSkillPrompt(catalog, item.prompt))),
    ...manifest.pairwise.map(item => routingObservation('pairwise', item, rankSkillPrompt(catalog, item.prompt))),
  ]
  const collisions = descriptionCollisions(catalog, manifest.collision_threshold)
  return {
    version: manifest.version,
    result: cases.every(item => item.passed) && collisions.length === 0 ? 'passed' : 'failed',
    scope: { published_skills: catalog.length, focused_owners: manifest.owners },
    limitations: [
      'deterministic lexical regression evidence only',
      'does not prove host or provider trigger behavior',
    ],
    cases,
    collisions,
  }
}

export function runSkillRoutingEvaluation(root) {
  const catalog = loadPublishedSkillCatalog(root)
  const manifest = loadSkillRoutingManifest(root, catalog)
  return evaluateSkillRouting({ catalog, manifest })
}

function main() {
  const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)))
  const result = runSkillRoutingEvaluation(root)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (result.result !== 'passed')
    process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main()
