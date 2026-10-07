import { Buffer } from 'node:buffer'
import { parse, stringify } from 'yaml'
import { evidenceMetadata, verifyEvidence } from './evidence.mjs'
import { listRefreshes, readRefresh } from './refresh.mjs'
import { entries, errorDetails, exists, fail, hash, ID, publishFile, readBytes, safePath, slug, writeDraft } from './storage.mjs'

export function parseRef(value) {
  if (typeof value !== 'string')
    fail('invalid', 'A study revision must be an exact study@SHA-256 reference')
  const parts = value.split('@')
  if (parts.length !== 2 || !ID.test(parts[1]))
    fail('invalid', `Expected exact study@SHA-256 reference: ${value}`)
  return { study: slug(parts[0]), revision: parts[1] }
}

function revisionPath(ref) {
  const { study, revision } = parseRef(ref)
  return `research/studies/${study}/revisions/${revision}.md`
}

function draftPath(study) {
  return `research/studies/${slug(study)}/draft.md`
}

export function parseStudy(bytes, { requireBody = true, requireEvidence = true } = {}) {
  const text = bytes.toString('utf8')
  if (!Buffer.from(text).equals(bytes))
    fail('corrupt', 'Study must contain valid UTF-8')
  const matched = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text)
  if (!matched)
    fail('invalid', 'Study needs YAML frontmatter containing brief and evidence')
  let metadata
  try {
    metadata = parse(matched[1])
  }
  catch (error) {
    fail('invalid', `Invalid study frontmatter: ${error.message}`)
  }
  if (!metadata || typeof metadata.brief !== 'string' || !metadata.brief.trim())
    fail('invalid', 'Study brief must be nonempty')
  if (!Array.isArray(metadata.evidence) || (requireEvidence && !metadata.evidence.length) || metadata.evidence.some(id => typeof id !== 'string' || !ID.test(id)) || new Set(metadata.evidence).size !== metadata.evidence.length)
    fail('invalid', `Study evidence must be a ${requireEvidence ? 'nonempty ' : ''}unique array of SHA-256 identities`)
  const supersedes = metadata.supersedes ?? []
  for (const field of ['coverage', 'baseline', 'refreshes']) {
    const values = metadata[field] ?? []
    if (!Array.isArray(values) || values.some(value => typeof value !== 'string') || new Set(values).size !== values.length)
      fail('invalid', `Study ${field} must be a unique array of references`)
    if (field === 'refreshes') {
      if (values.some(value => !value.startsWith('refresh@') || !ID.test(value.slice(8))))
        fail('invalid', 'Study refreshes must contain refresh@SHA-256 references')
    }
    else if (values.some(value => !metadata.evidence.includes(value))) {
      fail('invalid', `Study ${field} references must also be direct evidence`)
    }
    metadata[field] = values
  }
  if (!Array.isArray(supersedes) || new Set(supersedes).size !== supersedes.length)
    fail('invalid', 'Study supersedes must be an array of unique exact references')
  supersedes.forEach(parseRef)
  if (requireBody && !matched[2].trim())
    fail('invalid', 'Write a nonempty research body before sealing')
  return { metadata: { ...metadata, supersedes }, body: matched[2], text }
}

function renderStudy(metadata, body) {
  return Buffer.from(`---\n${stringify(metadata)}---\n${body}`)
}

export async function newStudy(root, study, brief, evidence = [], { refreshes = [], baseline = [] } = {}) {
  slug(study)
  if (study === 'refresh')
    fail('invalid', 'The study name refresh is reserved for refresh references')
  if (typeof brief !== 'string' || !brief.trim())
    fail('invalid', 'new requires --brief')
  const metadata = { brief, evidence: [...new Set([...evidence, ...baseline])], coverage: [], baseline: [...new Set(baseline)], refreshes: [...new Set(refreshes)], supersedes: [] }
  const bytes = renderStudy(metadata, '\n')
  // Validate metadata without pretending that the empty body is completed research.
  parseStudy(bytes, { requireBody: false, requireEvidence: false })
  await validateDirect(root, { metadata }, verificationContext())
  if ((await entries(root, `research/studies/${study}/revisions`)).length)
    fail('invalid', 'Study already has revisions; use revise --from an exact reference')
  await writeDraft(root, draftPath(study), bytes)
  return { study, draft: draftPath(study), integrity: 'not-checked', sealed: false }
}

// Record identity is independent of its evidence and older lineage.
async function validatedRecord(root, ref, context) {
  if (context.done.has(ref))
    return context.done.get(ref)
  const bytes = await readBytes(root, revisionPath(ref))
  if (hash(bytes) !== parseRef(ref).revision)
    fail('corrupt', `Sealed revision bytes differ from identity: ${ref}`)
  let parsed
  try {
    parsed = parseStudy(bytes)
  }
  catch (error) {
    if (errorDetails(error).kind === 'invalid')
      fail('corrupt', `Invalid sealed revision: ${ref}: ${error.message}`)
    throw error
  }
  const result = { ref, bytes, ...parsed }
  context.done.set(ref, result)
  return result
}

function verificationContext() {
  return { done: new Map(), evidence: new Set() }
}

async function validateDirect(root, parsed, context) {
  for (const id of parsed.metadata.evidence) {
    if (!context.evidence.has(id)) {
      await verifyEvidence(root, id)
      context.evidence.add(id)
    }
  }
  for (const id of parsed.metadata.coverage) {
    const { manifest } = await evidenceMetadata(root, id)
    if (manifest.origin.kind !== 'git' || !manifest.origin.source || !manifest.origin.ref)
      fail('invalid', 'Coverage requires tracked Git snapshots with source identities')
  }
  for (const ref of parsed.metadata.refreshes)
    await readRefresh(root, ref)
  for (const ref of parsed.metadata.supersedes)
    await validatedRecord(root, ref, context)
  return parsed
}

async function validatedRevision(root, ref, context) {
  const record = await validatedRecord(root, ref, context)
  await validateDirect(root, record, context)
  return record
}

function uncheckedHistory() {
  return { integrity: 'not-checked', diagnostics: [] }
}

// Explicit full-graph auditing collects failures across independent branches.
// Ordinary operations never enter this traversal.
async function auditHistory(root, target) {
  const context = verificationContext()
  const visiting = new Set()
  const visited = new Set()
  const checkedEvidence = new Set()
  const diagnostics = []
  const diagnose = (target, error) => diagnostics.push({ target, ...errorDetails(error) })
  async function visit(ref, draft = false) {
    if (visiting.has(ref)) {
      diagnostics.push({ target: ref, kind: 'corrupt', message: `Cyclic supersedes references: ${ref}` })
      return
    }
    if (visited.has(ref))
      return
    visited.add(ref)
    visiting.add(ref)
    let record
    try {
      record = draft ? parseStudy(await readBytes(root, draftPath(ref))) : await validatedRecord(root, ref, context)
    }
    catch (error) {
      diagnose(ref, error)
    }
    if (record) {
      for (const id of record.metadata.evidence) {
        if (checkedEvidence.has(id))
          continue
        checkedEvidence.add(id)
        try {
          await verifyEvidence(root, id)
        }
        catch (error) {
          diagnose(id, error)
        }
      }
      for (const refresh of record.metadata.refreshes) {
        try {
          await readRefresh(root, refresh)
        }
        catch (error) {
          diagnose(refresh, error)
        }
      }
      for (const prior of record.metadata.supersedes)
        await visit(prior)
    }
    visiting.delete(ref)
  }
  await visit(target, !target.includes('@'))
  const integrity = ['corrupt', 'operational-error', 'unavailable', 'invalid'].find(kind => diagnostics.some(item => item.kind === kind)) ?? 'valid'
  return { integrity, diagnostics, checkedEvidence: [...checkedEvidence], checkedRevisions: [...context.done.keys()] }
}

export async function sealStudy(root, study) {
  const path = draftPath(study)
  const bytes = await readBytes(root, path)
  const parsed = await validateDirect(root, parseStudy(bytes), verificationContext())
  const ref = `${study}@${hash(bytes)}`
  const revisions = await entries(root, `research/studies/${study}/revisions`)
  if (revisions.length && !revisions.includes(`${hash(bytes)}.md`) && !parsed.metadata.supersedes.some(prior => parseRef(prior).study === study))
    fail('invalid', 'A new revision of an existing study must supersede a verified exact revision of the same study; use revise')
  const created = await publishFile(root, revisionPath(ref), bytes)
  return { study, ref, created, path: revisionPath(ref), integrity: 'valid', history: uncheckedHistory(), semanticApproval: false }
}

export async function reviseStudy(root, study, from) {
  slug(study)
  if (parseRef(from).study !== study)
    fail('invalid', 'revise --from must reference the same study')
  const prior = await validatedRecord(root, from, verificationContext())
  const path = draftPath(study)
  let expected
  if (await exists(await safePath(root, path))) {
    expected = await readBytes(root, path)
    const currentRef = `${study}@${hash(expected)}`
    if (!await exists(await safePath(root, revisionPath(currentRef))))
      fail('invalid', 'Draft has unsealed edits; preserve or seal them before revising')
    const current = await validatedRecord(root, currentRef, verificationContext())
    if (!current.bytes.equals(expected))
      fail('corrupt', 'Draft differs from its sealed bytes')
  }
  const bytes = renderStudy({ ...prior.metadata, supersedes: [from] }, prior.body)
  await writeDraft(root, path, bytes, expected)
  return { study, draft: path, from, integrity: 'not-checked', sealed: false }
}

// list/show read metadata only. They do not claim identity or payload verification.
export async function showStudy(root, target) {
  const ref = target.includes('@') ? target : undefined
  const path = ref ? revisionPath(ref) : draftPath(target)
  const bytes = await readBytes(root, path)
  const text = bytes.toString('utf8')
  // Empty editable drafts are valid to view, though not valid to seal.
  const parsed = parseStudy(bytes, { requireBody: false, requireEvidence: false })
  return { study: ref ? parseRef(ref).study : target, ...(ref ? { ref } : {}), path, metadata: parsed.metadata, body: parsed.body, text, integrity: 'not-checked' }
}

export async function listResearch(root) {
  const studies = []
  for (const study of await entries(root, 'research/studies')) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(study))
      continue
    const revisions = (await entries(root, `research/studies/${study}/revisions`)).filter(name => ID.test(name.replace(/\.md$/, '')) && name.endsWith('.md')).map(name => `${study}@${name.slice(0, -3)}`)
    const draft = await exists(await safePath(root, draftPath(study)))
    let brief = null
    let diagnostic
    try {
      if (draft)
        brief = (await showStudy(root, study)).metadata.brief
    }
    catch (error) {
      diagnostic = errorDetails(error)
    }
    studies.push({ study, brief, draft, revisions, integrity: 'not-checked', ...(diagnostic ? { diagnostic } : {}) })
  }
  const evidence = []
  for (const id of await entries(root, 'research/evidence')) {
    if (!ID.test(id))
      continue
    try {
      const { manifest } = await evidenceMetadata(root, id)
      evidence.push({ id, origin: manifest?.origin ?? null, fileCount: Array.isArray(manifest?.files) ? manifest.files.length : null, integrity: 'not-checked' })
    }
    catch (error) {
      evidence.push({ id, integrity: 'not-checked', diagnostic: errorDetails(error) })
    }
  }
  return { studies, evidence, refreshes: await listRefreshes(root), integrity: 'not-checked' }
}

export async function checkStudy(root, target, { history = false } = {}) {
  let result
  try {
    const context = verificationContext()
    if (target.includes('@'))
      await validatedRevision(root, target, context)
    else
      await validateDirect(root, parseStudy(await readBytes(root, draftPath(target))), context)
    result = { target, integrity: 'valid', semanticApproval: false, checkedEvidence: [...context.evidence], checkedRevisions: [...context.done.keys()] }
  }
  catch (error) {
    result = { target, integrity: errorDetails(error).kind, error: errorDetails(error), semanticApproval: false }
  }
  return { ...result, history: history ? await auditHistory(root, target) : uncheckedHistory() }
}

export async function compareStudies(root, before, after) {
  parseRef(before)
  parseRef(after)
  const context = verificationContext()
  const left = await validatedRecord(root, before, context)
  const right = await validatedRecord(root, after, context)
  return {
    before,
    after,
    recordIntegrity: 'valid',
    evidenceIntegrity: 'not-checked',
    history: uncheckedHistory(),
    semanticApproval: false,
    briefChanged: left.metadata.brief !== right.metadata.brief,
    bodyChanged: left.body !== right.body,
    coverageChanged: JSON.stringify(left.metadata.coverage) !== JSON.stringify(right.metadata.coverage),
    baselineChanged: JSON.stringify(left.metadata.baseline) !== JSON.stringify(right.metadata.baseline),
    refreshesChanged: JSON.stringify(left.metadata.refreshes) !== JSON.stringify(right.metadata.refreshes),
    addedEvidence: right.metadata.evidence.filter(id => !left.metadata.evidence.includes(id)),
    removedEvidence: left.metadata.evidence.filter(id => !right.metadata.evidence.includes(id)),
    beforeText: left.text,
    afterText: right.text,
  }
}

export async function studyRecord(root, ref) {
  return validatedRecord(root, ref, verificationContext())
}
