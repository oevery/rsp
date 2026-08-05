import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { canonicalEnum, findSemanticUnit, markdownHeadings, markdownLinks, markdownSection, orderedMarkers } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const manageSkill = read('skills/rsp-manage/SKILL.md')
const manageInterruption = read('skills/rsp-manage/references/interruption-recovery.md')
const manageReview = read('skills/rsp-manage/references/review-convergence.md')
const manageCloseout = read('skills/rsp-manage/references/closeout.md')
const managed = read('skills/rsp/references/managed-routing.md')
const durable = read('skills/rsp/references/durable-review.md')
const releaseOperations = read('skills/rsp/references/release-operations.md')
const reopenRecovery = read('skills/rsp/references/reopen-recovery.md')
const fallback = read('rules/rsp-rules.md')
const shape = read('skills/rsp-shape/SKILL.md')
const coreModel = read('.rsp/specs/core-model.md')
const skillSystem = read('.rsp/specs/skill-system.md')
const coreContract = `${skill}\n${managed}\n${manageSkill}\n${releaseOperations}\n${reopenRecovery}`

function expectSemanticGroup(body: string, alternatives: string[][]): void {
  for (const group of alternatives) {
    expect(group.some(term => body.includes(term)), `missing semantic group: ${group.join(' | ')}`).toBe(true)
  }
}

describe('rsp core routing contract', () => {
  it('keeps a compact routing entrypoint and conditionally loaded procedures', () => {
    expect(markdownHeadings(skill)).toEqual([
      'Scope',
      'Derive one next action',
      'Implementation evidence',
      'Operate the selected Change',
      'Ownership and safety',
      'Durable decision output',
    ])

    for (const path of [
      'references/setup-repair.md',
      'references/groups-dependencies.md',
      'references/conflict-handling.md',
      'references/durable-review.md',
      'references/managed-routing.md',
      'references/release-operations.md',
      'references/reopen-recovery.md',
    ]) {
      expect(markdownLinks(skill)).toContain(path)
      expect(read(`skills/rsp/${path}`)).toMatch(/Load this reference only|Load this reference before/)
    }
  })

  it('keeps the fallback as a safety kernel after project Skill discovery has failed', () => {
    expect(markdownHeadings(fallback)).toEqual([
      'Entry',
      'Ownership',
      'One bounded action',
      'Durable routing',
      'Safety ceiling',
    ])
    expect(fallback.split(/\s+/).length).toBeLessThan(skill.split(/\s+/).length)
    expect(fallback).toContain('only after the Core Skill is absent or cannot be used')
    expect(fallback).not.toContain('.agents/skills/rsp/SKILL.md')
    expectSemanticGroup(fallback, [
      ['Treat `focus.d/` as the only current-focus source'],
      ['`changes/` owns open work'],
      ['`specs/` owns stable current facts'],
      ['Perform at most one bounded ordinary Core action or one optional Discipline action'],
      ['one ready owner'],
      ['settled acceptance criteria'],
      ['one decisive verification'],
      ['Route planned future design to the selected Change'],
      ['stable implemented facts to the smallest authoritative Spec'],
      ['lasting rationale to the configured Decision Record path'],
      ['temporary execution or continuation state to the response'],
      ['does not emulate `rsp-manage`'],
      ['fail closed without mutation'],
      ['never archives'],
      ['stages, commits, tags, pushes, publishes, deploys'],
      ['approval'],
    ])
    expect(fallback).not.toContain('`RouteDisposition`')
    expect(fallback).not.toContain('three Resolve Findings passes')
    expect(fallback).not.toContain('base/ours/theirs')
    expect(fallback).not.toContain('Route release documentation')
  })

  it('derives one evidence-backed action with capability and owner boundaries', () => {
    expectSemanticGroup(coreContract, [
      ['user intent'],
      ['`rsp status --json`'],
      ['readiness'],
      ['fresh verification evidence'],
      ['blockers'],
      ['Name at most one optional capability', 'Name at most one optional Discipline Skill'],
      ['host\'s loaded Skill inventory'],
      ['manual fallback'],
      ['returned owner'],
    ])
    expect(skill).toContain('Stages are derived guidance, never persisted state')
    expect(skill).toContain('Do not preload, enumerate, or recursively invoke optional capabilities')
  })

  it('keeps WorkRef identity boundaries in Core and detailed inference with its owners', () => {
    expect(skill).toContain('WorkRefs are stable identities independent from artifact, commit, response, host locale, and TUI language settings')
    expect(skill).toContain('Existing identities are never renamed by later language or naming guidance')
    expect(skill).toContain('when a new WorkRef must be inferred, Shape owns its naming policy')
    expect(skill).not.toContain('ASCII lowercase kebab-case')
    expect(skill).not.toContain('explicit nearest project or domain WorkRef naming convention')

    for (const body of [shape, fallback, coreModel]) {
      const lowered = body.toLowerCase()
      expect(body).toContain('explicit valid user')
      expect(body).toContain('project or domain')
      expect(body).toContain('ASCII lowercase kebab-case')
      expect(lowered).toContain('language')
      expect(lowered).toContain('locale')
      expect(body).toContain('Unicode')
      expectSemanticGroup(body, [
        ['existing identit', 'an existing open or archived identity', 'existing open or archived identities'],
      ])
    }
    expect(fallback).toContain('Language or locale settings never select or translate WorkRef language')
  })

  it('limits manual fallback to optional Disciplines without replacing required managed evidence', () => {
    expectSemanticGroup(skill, [
      ['optional Discipline Skill'],
      ['bounded manual fallback'],
      ['same owner'],
      ['never substitutes for a required managed worker'],
      ['required independent Verify'],
      ['acceptance incomplete'],
      ['`capability-unavailable`'],
      ['more specific evidenced `StopDisposition`'],
    ])
  })

  it('routes implementation by explained risk instead of by fix labels', () => {
    expect(markdownHeadings(skill)).toContain('Implementation evidence')
    expectSemanticGroup(coreContract, [
      ['`rsp-diagnose`'],
      ['unexplained'],
      ['`rsp-tdd`'],
      ['explicitly required'],
      ['concrete changed risk'],
      ['mere testability or being a fix does not'],
      ['Ordinary implementation by default'],
      ['cheapest decisive check'],
      ['same Change'],
    ])
  })

  it('routes design, managed work, and release operations without granting authority', () => {
    expectSemanticGroup(coreContract, [
      ['one explicit isolated material domain, module/seam, or evidence-seeking design question'],
      ['`rsp-design`'],
      ['explicitly managed'],
      ['effective `manage.activation: auto`', '`manage.activation: auto`'],
      ['`manage.activation: auto`'],
      ['one selected ready Change'],
      ['genuinely independent slices'],
      ['Automatic activation grants controller selection only'],
      ['explicitly requests release documentation, finalization, publication, or reconciliation'],
      ['confirmed identity or range'],
      ['A selected Change is not required'],
      ['`rsp-release-docs`'],
      ['Never infer it from version order'],
      ['credential-free `ready` or `not ready`'],
    ])
    expect(releaseOperations).toMatch(/never executes or grants commit, tag, push, release creation, publication, deployment, or approval authority/)
    expect(releaseOperations).toContain('Load it before requiring a confirmed identity, range, or clean candidate')
    expect(releaseOperations).toContain('An unconfirmed identity or range, unclean exact candidate, missing owner, or material release-surface ambiguity stops before versioned mutation')
  })

  it('resolves a ready owner in Core before Manage qualification', () => {
    const lowered = managed.toLowerCase()
    const resolveOwner = lowered.indexOf('core resolves the smallest sufficient owner before testing manage eligibility')
    const qualifyManage = lowered.indexOf('select `rsp-manage` only')

    expect(resolveOwner).toBeGreaterThanOrEqual(0)
    expect(qualifyManage).toBeGreaterThan(resolveOwner)
    expectSemanticGroup(managed, [
      ['fixed-scope Review, release, isolated Design, and tiny settled-work exceptions'],
      ['complete small-work exclusion'],
      ['one ownership `ControlOutcome`'],
      ['`WorkOwner` means the selected shape-ready Change or shallow Group'],
      ['in-scope RSP planning artifacts'],
      ['freshly derives ownership, route, and qualification'],
      ['without another authorization round'],
      ['material product or authority decision'],
      ['return evidence to Core'],
      ['without dispatching work or mutating product state'],
    ])
    expect(managed).toContain('Automatic activation grants controller selection only')
    expect(managed).toContain('configuration alone never does')
    expect(skill).toContain('](references/managed-routing.md)')
    expect(fallback).toContain('This fallback does not emulate `rsp-manage`')
    expect(fallback).toContain('Configuration selects no capability and grants no planning, product-mutation, lifecycle, Git, publication, deployment, approval, or human-acceptance authority')
  })

  it('routes missing ownership through Shape before managed execution', () => {
    const review = skill.indexOf('Route an explicit report-only review')
    const release = skill.indexOf('Route an explicit release-documentation')
    const design = skill.indexOf('Route one explicit isolated material')
    const tiny = skill.indexOf('Return tiny settled work directly')
    const owner = skill.indexOf('Core resolves whether one unambiguous shape-ready Change or shallow Group is the `WorkOwner`')

    expect([review, release, design, tiny, owner].every(index => index >= 0)).toBe(true)
    expect(review).toBeLessThan(release)
    expect(release).toBeLessThan(design)
    expect(design).toBeLessThan(tiny)
    expect(tiny).toBeLessThan(owner)
    expect(skill).toContain('Missing or non-ready ownership reports `RouteDisposition: shape`')
    expect(skill).toContain('then re-reads status and freshly derives ownership and routing')

    expect(managed).toContain('## OWNER PREFLIGHT — Core resolves the owner without execution')
    expect(managed).toContain('Core derives one ownership `ControlOutcome`')
    expect(managed).toContain('Shape returns the ready WorkOwner to Core')
    expect(managed).toContain('Owner preflight creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef')

    expect(manageSkill).toContain('## Selected-goal entry')
    expect(manageSkill).toContain('Manage has no pre-owner Intake')
    expect(manageSkill).toContain('never creates, focuses, or reshapes a durable owner')
  })

  it('continues an ordinary ready non-small Change when explicit activation does not select Manage', () => {
    const routeSix = skill.match(/^6\. (.+)$/m)?.[1] ?? ''
    const implementation = skill.indexOf('8. For incomplete implementation')
    const durableDecision = skill.indexOf('9. When Tasks and required verification pass')

    expectSemanticGroup(routeSix, [
      ['`manage.activation: explicit`', 'under `explicit`'],
      ['qualify only an explicitly managed request'],
    ])
    const routeSeven = skill.match(/^7\. (.+)$/m)?.[1] ?? ''
    expectSemanticGroup(routeSeven, [
      ['stop only when authority or selection is actually ambiguous'],
      ['Otherwise preserve ordinary routing under the clear ready WorkOwner'],
      ['Implementation evidence'],
      ['durable decision'],
      ['without an explicitly managed request is not itself a stop signal'],
    ])
    expect([implementation, durableDecision].every(index => index >= 0)).toBe(true)
    expect(implementation).toBeLessThan(durableDecision)
  })

  it('defines peer route dispositions and explicit stop resume contracts', () => {
    const routing = markdownSection(skill, 'Derive one next action')
    expect(canonicalEnum(routing, 'RouteDisposition')).toEqual(['specialist', 'direct', 'managed', 'shape', 'stop'])
    expect(canonicalEnum(routing, 'StopDisposition')).toEqual([
      'ask-owner',
      'return-to-shape',
      'reroute',
      'retry-with-evidence',
      'environment-blocked',
      'verification-blocked',
      'capability-unavailable',
    ])
    expect(findSemanticUnit(routing, ['`specialist`', 'Discipline result', 'completion controller'])).toBeDefined()
    expect(findSemanticUnit(routing, ['`direct`', 'non-managed completion', 'one decisive verification', 'no WorkerEnvelope'])).toBeDefined()
    expect(findSemanticUnit(routing, ['Core', 'control-plane state', 'product mutation', 'Implement'])).toBeDefined()
    expect(findSemanticUnit(routing, ['`managed`', 'shape-ready owner', 'Manage', 'worker lanes', 'review convergence'])).toBeDefined()
    expect(findSemanticUnit(routing, ['`shape`', 'Shape'])).toBeDefined()
    expect(findSemanticUnit(routing, ['`stop`', '`StopDisposition`'])).toBeDefined()
    expect(findSemanticUnit(routing, [
      'No stop disposition',
      'worker dispatch',
      'product mutation',
      'lifecycle closeout',
      'Git action',
      'resume contract',
    ])).toBeDefined()

    expect(findSemanticUnit(routing, ['response-only', 'transient', '`ControlOutcome`'])).toBeDefined()
    expect(findSemanticUnit(routing, ['phase-specific disposition', 'decisive evidence', 'next owner', 'required input', 'resuming or rederiving'])).toBeDefined()
    expect(findSemanticUnit(routing, ['Never persist', 'Change', 'Group Brief', 'Spec', 'Decision Record', 'archive', 'registry', 'generated projection'])).toBeDefined()
    expect(fallback).toContain('Persist only `open` and `archived` lifecycle state')
  })

  it('fails semantic routing contracts when enums, owner boundaries, or stop authority are weakened', () => {
    const routing = markdownSection(skill, 'Derive one next action')
    const withoutManaged = routing.replace('`managed`, ', '')
    const reassignedProductMutation = routing.replace(
      'product mutation belongs to Implement or the same bounded manual Discipline action',
      'product mutation belongs to Core',
    )
    const widenedStop = routing.replace('No stop disposition permits', 'Every stop disposition permits')

    expect(canonicalEnum(withoutManaged, 'RouteDisposition')).not.toEqual(['specialist', 'direct', 'managed', 'shape', 'stop'])
    expect(findSemanticUnit(reassignedProductMutation, ['Core', 'control-plane state', 'product mutation', 'Implement'])).toBeUndefined()
    expect(findSemanticUnit(widenedStop, ['No stop disposition', 'worker dispatch', 'product mutation', 'Git action'])).toBeUndefined()
  })

  it('keeps owner resolution in Core and selected execution in Manage', () => {
    expect(managed).toContain('`WorkOwner` means the selected shape-ready Change or shallow Group')
    expect(managed).toContain('Missing or non-ready ownership uses `RouteDisposition: shape`')
    expect(managed).toContain('A material product or authority decision stops with `StopDisposition: ask-owner`')
    expect(managed).toContain('Manage has no pre-owner Intake')
    expect(manageSkill).toContain('Core resolves ownership before this Skill is entered')
    expect(manageSkill).toContain('Reject an incomplete handoff without mutation and return to Core')
    expect(manageSkill).toContain('Core and its managed-routing reference solely own initial Manage qualification')
    expect(manageSkill).toContain('Manage never repeats the direct-versus-managed eligibility test')
    expect(manageSkill).not.toContain('## Qualify before mutation')
    expect(manageSkill).not.toContain('Decline Manage without any mutation')
    expect(manageSkill).not.toContain('`needs-shape`')
    expect(manageSkill).not.toContain('`needs-owner`')
    expect(skill).toContain('`return-to-shape` resumes only after Shape confirms a ready owner')
  })

  it('rederives a direct route when later authorized scope materially expands', () => {
    for (const body of [skill, managed]) {
      expectSemanticGroup(body, [
        ['Before later-turn mutation'],
        ['direct report, design, tiny, or small route'],
        ['now-authorized objective', 'newly authorized objective'],
        ['prospective work'],
        ['cross-module implementation', 'Cross-module implementation'],
        ['multiple acceptance surfaces'],
        ['repeated production-path correction'],
        ['real-host validation'],
        ['bounded review convergence'],
        ['lifecycle delivery'],
        ['clear ready successor'],
        ['smallest sufficient WorkRef'],
        ['fresh Manage qualification', 'fresh qualification', 'fresh owner preflight and Manage qualification', 'rerun owner preflight plus fresh Manage qualification', 'smallest sufficient WorkRef before mutation'],
        ['before mutation'],
        ['remain tiny/small', 'Unchanged tiny/small follow-ups remain direct', 'unchanged tiny/small follow-ups stay direct'],
        ['Elapsed time and message count', 'elapsed time and message count alone'],
      ])
    }

    const rederive = skill.indexOf('Before later-turn mutation')
    const routes = skill.indexOf('1. Route an explicit report-only review')
    expect(rederive).toBeGreaterThanOrEqual(0)
    expect(routes).toBeGreaterThan(rederive)
    expect(skill).toContain('Report `RouteDisposition: direct`. Perform no Manage handoff or WorkerEnvelope')
    expect(skill).toContain('rederive before further mutation if prospective work expands beyond any condition')
    expect(fallback).toContain('Before later mutation or a different WorkRef, rederive authority')
    expect(fallback).toContain('Do not auto-continue a successor or widen the boundary because more work is visible')
  })

  it('biases automatic Manage toward prospective non-small work while preserving one-step direct work', () => {
    for (const body of [managed, skillSystem]) {
      expectSemanticGroup(body, [
        ['independent slices', 'independent mutation/verification slices'],
        ['interruption recovery'],
        ['implementation followed by integration verification', 'implementation plus integration/review/lifecycle'],
        ['cross-module or cross-process mutation'],
        ['real-host, provider, or hardware verification', 'real-host/provider/hardware verification'],
        ['bounded finding convergence'],
        ['clear ready successor'],
        ['one owner, one local seam, one mutation pass, one decisive check'],
        ['no managed lifecycle coordination'],
        ['no ready successor'],
        ['fails any one', 'fails any one condition'],
        ['non-small'],
      ])
    }
    expect(managed).toContain('bias non-small continuation toward Manage')
    expect(managed).toContain('Decline as direct one-step work only when all of these are true')
    expect(managed).toContain('do not leave the middle case unclassified')
    expect(managed).toContain('elapsed wall-clock minutes are never qualification evidence')
    expect(managed).toContain('authoritative Specs, product presentation, public documentation, and multiple verification surfaces')
    expect(managed).toContain('even when one writer owns all mutations and dispatch must remain sequential')
    expect(managed).toContain('Writer count and lack of parallelism do not collapse multiple acceptance or authority surfaces into one local seam')
    expect(fallback).toContain('Perform at most one bounded ordinary Core action or one optional Discipline action against the same owner')
    expect(fallback).toContain('If the action becomes multi-owner, cross-boundary, dependent on managed coordination')
    expect(skillSystem).toContain('lack of parallelizable slices does not defeat qualification')
  })

  it('separates implementation verification, fixed-scope change review, and durable writeback', () => {
    for (const body of [skillSystem, durable, manageSkill]) {
      expect(body).toContain('implementation verification')
      expect(body).toContain('fixed-scope change review')
      expect(body).toContain('durable writeback decision')
    }
    expect(durable).toContain('not automatically required for every tiny direct action')
    expect(durable).toContain('always required before archive')
    expect(durable).toContain('never substitutes for fixed-scope change review')
    expect(manageSkill).toContain('Only a clean fixed-scope change review may then derive managed `review-clean`')
    expect(manageSkill).toContain('The later durable writeback decision cannot substitute for fixed-scope change review')
  })

  it('makes managed selection and safe dispatch reasoning observable without controller state', () => {
    expect(skill).toContain('state `selected` or `declined` with the decisive qualification signal or complete direct-work exclusion')
    expect(skill).toContain('state why it is parallel or sequential')
    expect(managed).toContain('report `selected` with the decisive qualification signal')
    expect(managed).toContain('`declined` with the complete direct-work exclusion')
    expect(managed).toContain('concrete overlap/isolation evidence that makes it sequential or parallel')
    expect(managed).toContain('create no controller state')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('worker dispatch')
    expect(skillSystem).toContain('a Manage run with a valid selected handoff dispatches at least one implementation worker with a complete owner envelope')
    expect(skillSystem).toContain('Delegation never requires parallelism')
    expect(skillSystem).toContain('This observability is response-only and creates no controller state')
  })

  it('blocks implicit dirty-path ownership transfer between WorkRefs', () => {
    for (const body of [skill, managed]) {
      expectSemanticGroup(body, [
        ['Before focusing or mutating a different WorkRef', 'Before focusing, dispatching, or mutating a different WorkRef'],
        ['dirty paths', 'dirty product or durable-truth paths'],
        ['prior owner'],
        ['product or durable-truth paths'],
        ['continue the same open WorkRef', 'continuation of the same open WorkRef'],
        ['reopen its archived acceptance', 'reopen archived acceptance', 'explicitly authorized reopen', 'authorized reopen'],
        ['explicitly authorized integration owner'],
        ['stop for boundary resolution'],
        ['Disjoint authorized work may proceed'],
        ['without staging or forcing a commit', 'without staging or a forced commit'],
      ])
    }
    expect(skill).toContain('insufficient evidence stops the transition')
    expect(managed).toContain('insufficient ownership evidence stops the transition')
    expect(fallback).toContain('stop for boundary resolution when ownership overlaps or remains uncertain')
  })

  it('keeps same-goal progress inside Manage without persisting orchestration state', () => {
    expectSemanticGroup(managed, [
      ['transient authority envelope'],
      ['Ordinary Fix, Verify, Review, or Resolve Findings receipts remain inside Manage'],
      ['clear in-scope ready successor'],
      ['Owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, or external-action authority changes return evidence to Core'],
    ])
    expectSemanticGroup(managed, [
      ['Never persist the goal envelope, WorkSet, waves'],
      ['discovery classification', 'discovered-work classification'],
    ])
    expect(manageInterruption).toContain('Never persist a paused state, worker registry, controller ledger, or execution chronology')
    expect(manageReview).toContain('Keep counts and correction chronology transient')
  })

  it('returns in-scope managed review findings to bounded convergence', () => {
    expectSemanticGroup(manageReview, [
      ['After fixed-scope re-review'],
      ['selected Change'],
      ['original authority'],
      ['fresh verification'],
      ['transient pass count'],
      ['`accepted` Finding'],
      ['`correction-needed`'],
      ['without asking the user to continue'],
      ['Resolve Findings never self-loops'],
      ['`needs-clarification`'],
      ['outside existing verification authority'],
      ['repeated non-convergence', 'same Finding remains after two completed corrections'],
    ])
    expect(manageReview).toContain('three Resolve Findings passes per Change')
    expect(manageReview).toContain('same Finding remains after two completed corrections')
    expect(manageReview).toContain('counts and correction chronology transient')
    expect(managed).not.toContain('three Resolve Findings passes per Change')
    expect(fallback).not.toContain('three Resolve Findings passes per Change')
    expect(fallback).toContain('does not emulate `rsp-manage`')
  })

  it('keeps persistent artifacts convergent and domain-owned', () => {
    expectSemanticGroup(skill, [
      ['sibling Group Brief when grouped'],
      ['relevant Specs and Decision Records'],
      ['convergent snapshot'],
      ['Replace superseded content'],
      ['routine attempts, RED/GREEN chronology'],
      ['domain, system, user, or operator language'],
      ['actual product actors or constraints'],
      ['planned design to the selected Change'],
      ['stable implemented facts'],
      ['lasting rationale'],
      ['temporary continuation to the response'],
    ])
  })

  it('preserves localized continuation and durable-decision structures', () => {
    const continuationFields = ['WorkRef', 'Authority', 'Current state', 'Changed artifacts', 'Fresh verification', 'Blockers', 'Next action']
    expect(orderedMarkers(skill, continuationFields.map(field => `\`${field}\``))).toBe(true)

    expect(skill).toContain('Response-only Continuation and Durable Decision labels are not canonical artifact headings')
    expect(skill).toContain('`决策记录（Decision Record）`')
    expect(skill).toContain('<No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>')
    expect(skill).toContain('<yes | no>')
  })

  it('prohibits inferred delivery and lifecycle actions', () => {
    expect(skill).toContain('Do not infer implementation, review, Git, publication, or approval authority')
    expect(skill).toMatch(/does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority/)
    expect(skill).toContain('Manage solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, and commit eligibility and orchestration')
    expect(skill).toContain('`rsp-commit` retains exact Git execution')
    expect(manageCloseout).toContain('inspect the complete lifecycle diff')
    expect(manageCloseout).toContain('after Manage-owned clean fixed-scope change review and the durable writeback decision run `rsp archive <change-work-ref>`')
    expect(manageCloseout).toContain('`rsp group close <group>`')
    expect(manageCloseout).toContain('Terminal small owners default to no commit')
    expect(manageCloseout).toContain('qualified `local` terminal non-small Change or Group')
    expect(manageCloseout).toContain('routes exactly once to `rsp-commit`')
    expect(manageCloseout).toContain('do not require the user to repeat `commit`')
    expect(manageCloseout).toContain('An ambiguous, mixed, stale, or denied boundary stops without staging')
    expect(manageCloseout).toContain('Push is opt-in only when user explicitly mentions push')
    expect(manageCloseout).toContain('Never force-push')
    expect(manageCloseout).toContain('`manual` grants neither automatic archive nor commit')
    expect(manageCloseout).toContain('`lifecycle` grants lifecycle closeout after Manage-owned clean fixed-scope change review and a complete durable writeback decision but no Git action')
    expect(manageCloseout).toContain('`local` automatically grants lifecycle closeout')
    expect(managed).toContain('Missing configuration preserves `explicit` activation with `local` closeout compatibility')
    expect(managed).toContain('Invalid configuration fails closed as `explicit` plus `manual`')
    expect(durable).toContain('`manual` leaves archive advisory')
    expect(durable).toContain('`lifecycle` or `local` permits `rsp archive <change-work-ref>`')
    expect(durable).toContain('`manual` and `lifecycle` grant no commit')
    expect(durable).toContain('`local` may justify recovery checkpoints')
    expect(skill).not.toMatch(/automatically (?:commit|push|publish|archive)/i)
  })

  it('keeps configured closeout dormant outside the currently qualified Manage route', () => {
    expect(skill).toContain('A configured `manage.closeout` preset remains dormant unless Core selected and qualified Manage for the current continuation')
    expect(managed).toContain('If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant')
    expect(managed).toContain('ordinary Core may report readiness and the explicit next lifecycle or Git action')
    expect(managed).toContain('Readiness, an earlier managed run, or project policy never substitutes for current selection and qualification')
    expect(durable).toContain('declined, unavailable, or unselected Manage leaves Core advisory')
    expect(durable).toContain('In a qualified managed continuation')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('configured closeout')
  })

  it('routes an authorized RSP-owned local boundary to Commit with an equivalent manual fallback', () => {
    expect(skill).toContain('route exact staging, structured message construction, local commit execution, and post-commit observation to `rsp-commit`')
    expect(durable).toContain('one envelope containing the Change, Group/wave, or confirmed release owner')
    expect(durable).toContain('stage only allowed paths')
    expect(durable).toContain('repository-consistent Conventional subject plus a proportionate body and truthful RSP trailers')
    expect(durable).toContain('observe its complete message, paths, remaining worktree, and remote safety')
    expect(manageCloseout).toContain('routes exactly once to `rsp-commit`')
    expect(manageCloseout).toContain('return `StopDisposition: capability-unavailable` to Core for its bounded manual Commit fallback')
    expect(manageCloseout).toContain('Manage does not stage or commit')
    expect(fallback).toContain('This fallback never archives, closes a Group, stages, commits, tags, pushes, publishes, deploys')
  })
})
