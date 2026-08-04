import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const manageSkill = read('skills/rsp-manage/SKILL.md')
const managed = read('skills/rsp/references/managed-routing.md')
const durable = read('skills/rsp/references/durable-review.md')
const releaseOperations = read('skills/rsp/references/release-operations.md')
const reopenRecovery = read('skills/rsp/references/reopen-recovery.md')
const fallback = read('rules/rsp-rules.md')
const skillSystem = read('.rsp/specs/skill-system.md')
const coreContract = `${skill}\n${managed}\n${manageSkill}\n${releaseOperations}\n${reopenRecovery}`

function headings(markdown: string): string[] {
  const prose = markdown.replace(/```[\s\S]*?```/g, '')
  return [...prose.matchAll(/^#{2,3} (.+)$/gm)].map(match => match[1])
}

function expectSemanticGroup(body: string, alternatives: string[][]): void {
  for (const group of alternatives) {
    expect(group.some(term => body.includes(term)), `missing semantic group: ${group.join(' | ')}`).toBe(true)
  }
}

describe('rsp core routing contract', () => {
  it('keeps a compact routing entrypoint and conditionally loaded procedures', () => {
    expect(headings(skill)).toEqual([
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
      expect(skill).toContain(`](${path})`)
      expect(read(`skills/rsp/${path}`)).toMatch(/Load this reference only|Load this reference before/)
    }
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
    expect(headings(skill)).toContain('Implementation evidence')
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
      ['effective status policy'],
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
    expect(fallback).toMatch(/Route release documentation only for an explicit release operation with a confirmed identity or range/)
  })

  it('resolves an explicitly or automatically managed owner through Intake before qualification', () => {
    const lowered = managed.toLowerCase()
    const resolveOwner = lowered.indexOf('intake resolves the smallest sufficient owner before testing manage eligibility')
    const qualifyManage = lowered.indexOf('select `rsp-manage` only')

    expect(resolveOwner).toBeGreaterThanOrEqual(0)
    expect(qualifyManage).toBeGreaterThan(resolveOwner)
    expectSemanticGroup(managed, [
      ['fixed-scope Review, release, isolated Design, and tiny settled-work exceptions'],
      ['complete small-work exclusion'],
      ['canonical `ControlOutcome`'],
      ['in-scope RSP planning artifacts'],
      ['repeats Intake selection and qualification'],
      ['without another authorization round'],
      ['Product or authority decisions remain with their returned owner'],
      ['without implementation or controller mutation'],
      ['return to Core for rerouting'],
      ['without focusing another owner, dispatching work, or mutating durable or product state'],
    ])
    expect(managed).toContain('Automatic activation grants controller selection only')
    expect(managed).toContain('configuration alone never does')
    expect(skill).toContain('](references/managed-routing.md)')
    expect(fallback).toContain('This fallback does not emulate `rsp-manage`')
    expect(fallback).toContain('even when project configuration selects automatic activation or local closeout')
    expect(fallback).toContain('Invalid configuration grants nothing and remains visible')
    expect(fallback).toContain('Configuration grants no planning or product-mutation authority')
  })

  it('routes non-small goals through transient Intake before Shape or managed execution', () => {
    const review = skill.indexOf('Route an explicit report-only review')
    const release = skill.indexOf('Route an explicit release-documentation')
    const design = skill.indexOf('Route one explicit isolated material')
    const tiny = skill.indexOf('Return tiny settled work directly')
    const intake = skill.indexOf('select the no-mutation Manage Intake')

    expect([review, release, design, tiny, intake].every(index => index >= 0)).toBe(true)
    expect(review).toBeLessThan(release)
    expect(release).toBeLessThan(design)
    expect(design).toBeLessThan(tiny)
    expect(tiny).toBeLessThan(intake)
    expect(skill).toContain('returns one canonical `ControlOutcome`')
    expect(skill).toContain('Core consumes its returned disposition, next owner, required input, and resume rule')
    expect(skill).toContain('re-reads status and repeats Intake selection and qualification')

    expect(managed).toContain('## INTAKE — resolve the owner without execution')
    expect(managed).toContain('Under `manage.activation: auto`, select Intake for every other requested completion or continuation')
    expect(managed).toContain('Invoke `rsp-manage` Intake and consume its canonical `ControlOutcome`')
    expect(managed).toContain('Canonical ready ownership identifies one unambiguous selected shape-ready Change or shallow Group')
    expect(managed).toContain('Intake creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef')

    expect(manageSkill).toContain('## Manage Intake')
    expect(manageSkill).toContain('It does not focus another owner, mutate a planning or product artifact, create a controller record, or dispatch a worker')
    expect(manageSkill).toContain('only `ready` enters `## Qualify before mutation`')
    expect(fallback).toContain('Preserve fixed-scope Review, release, isolated Design, and tiny settled-work exceptions before considering Manage')
    expect(fallback).toContain('Consume only the returned canonical `ControlOutcome`')
  })

  it('continues an ordinary ready non-small Change when explicit activation does not select Manage', () => {
    const routeFive = skill.match(/^5\. (.+)$/m)?.[1] ?? ''
    const routeSix = skill.match(/^6\. (.+)$/m)?.[1] ?? ''
    const routeSeven = skill.indexOf('7. If the Change is not shape-ready')
    const implementation = skill.indexOf('8. For incomplete implementation')
    const durableDecision = skill.indexOf('9. When Tasks and required verification pass')

    expectSemanticGroup(routeFive, [
      ['`manage.activation: explicit`', 'under `explicit`'],
      ['only for an explicitly managed request'],
    ])
    expectSemanticGroup(routeSix, [
      ['stop only when authority or selection is actually ambiguous'],
      ['Otherwise preserve ordinary routing under the clear ready owner'],
      ['Shape readiness'],
      ['Implementation evidence'],
      ['durable decision'],
      ['without an explicitly managed request is not itself a stop signal'],
    ])
    expect(routeSix).not.toMatch(/^If Manage Intake is not selected, stop for/)
    expect([routeSeven, implementation, durableDecision].every(index => index >= 0)).toBe(true)
    expect(routeSeven).toBeLessThan(implementation)
    expect(implementation).toBeLessThan(durableDecision)
  })

  it('defines peer route dispositions and explicit stop resume contracts', () => {
    expect(skill).toContain('`RouteDisposition` is exactly `specialist`, `direct`, `managed`, `shape`, or `stop`')
    expect(skill).toContain('`specialist` returns one explicit Discipline owner')
    expect(skill).toContain('`direct` permits one bounded Core or Implement mutation path with one decisive verification and no WorkerEnvelope')
    expect(skill).toContain('`managed` enters Manage Intake')
    expect(skill).toContain('`shape` returns unclear owned work to Shape')
    expect(skill).toContain('`stop` names one `StopDisposition`')
    expect(skill).toContain('exactly `ask-owner`, `return-to-shape`, `reroute`, `retry-with-evidence`, `environment-blocked`, `verification-blocked`, or `capability-unavailable`')
    expect(skill).toContain('No stop disposition permits worker dispatch, product mutation, lifecycle closeout, or Git action until its resume contract succeeds')

    expect(skill).toContain('one response-only transient `ControlOutcome`')
    expect(skill).toContain('phase-specific disposition, decisive evidence, next owner, required input when any, and the rule for resuming or rederiving')
    expect(skill).toContain('Never persist it in a Change, Group Brief, Spec, Decision Record, archive, registry, or generated projection')
    expect(fallback).toContain('Persist none of these values; lifecycle remains only `open` or `archived`')
  })

  it('keeps detailed Intake compatibility mapping owned only by rsp-manage', () => {
    expect(manageSkill).toContain('Intake returns exactly one response-only owner state')
    expect(manageSkill).toContain('canonical `OwnershipDisposition` is exactly `ready`, `ask-owner`, `return-to-shape`, or `reroute`')
    expect(manageSkill).toContain('`needs-shape` maps to canonical `OwnershipDisposition: return-to-shape`')
    expect(manageSkill).toContain('`needs-owner` maps to canonical `OwnershipDisposition: ask-owner`')
    expect(manageSkill).toContain('`out-of-goal` maps to canonical `OwnershipDisposition: reroute`')
    expect(manageSkill).toContain('resume through fresh Intake only after the owner answers')
    expect(manageSkill).toContain('Core must establish a new owner or authority boundary before continuing')
    expect(manageSkill).toContain('without turning it into a product question')
    expect(manageSkill).toContain('Every return is one transient `ControlOutcome` containing phase, disposition, decisive evidence, next owner, required input when any, and its resume or rederivation rule')

    for (const body of [skill, managed, fallback]) {
      expect(body).not.toContain('`needs-shape`')
      expect(body).not.toContain('`needs-owner`')
      expect(body).not.toContain('`out-of-goal`')
      expect(body).not.toContain('Intake returns exactly one of')
    }

    expect(managed).toContain('compatibility labels, exact canonical mappings, response schema, and detailed resume contracts are owned only by `rsp-manage`')
    expect(skill).toContain('`return-to-shape` resumes only after Shape confirms a ready owner')
    expect(fallback).toContain('Invoke Shape only when the returned outcome assigns it ownership')
  })

  it('rederives a direct route when later authorized scope materially expands', () => {
    for (const body of [skill, managed, fallback]) {
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
        ['fresh Manage qualification', 'fresh qualification', 'fresh Manage Intake selection and qualification', 'smallest sufficient WorkRef before mutation'],
        ['before mutation'],
        ['remain tiny/small', 'Unchanged tiny/small follow-ups remain direct', 'unchanged tiny/small follow-ups stay direct'],
        ['Elapsed time and message count', 'elapsed time and message count alone'],
      ])
    }

    const rederive = skill.indexOf('Before later-turn mutation')
    const routes = skill.indexOf('1. Route an explicit report-only review')
    expect(rederive).toBeGreaterThanOrEqual(0)
    expect(routes).toBeGreaterThan(rederive)
    expect(skill).toContain('Report `RouteDisposition: direct`. Perform no Manage Intake or WorkerEnvelope')
    expect(skill).toContain('rederive before further mutation if prospective work expands beyond any condition')
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
    expect(fallback).toContain('Elapsed time and message count alone never escalate work')
    expect(fallback).toContain('every other requested completion or continuation enters the loaded Skill\'s no-mutation Intake')
    expect(fallback).toContain('Tiny settled work remains direct only when one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor all hold')
    expect(skillSystem).toContain('lack of parallelizable slices does not defeat qualification')
  })

  it('makes managed selection and safe dispatch reasoning observable without controller state', () => {
    expect(skill).toContain('state `selected` or `declined` with the decisive qualification signal or complete direct-work exclusion')
    expect(skill).toContain('state why it is parallel or sequential')
    expect(managed).toContain('report `selected` with the decisive qualification signal')
    expect(managed).toContain('`declined` with the complete direct-work exclusion')
    expect(managed).toContain('concrete overlap/isolation evidence that makes it sequential or parallel')
    expect(managed).toContain('create no controller state')
    expect(fallback).toContain('reports that Manage is unavailable rather than selected')
    expect(fallback).toContain('any applicable serial/parallel overlap reason')
    expect(skillSystem).toContain('qualified Manage dispatches at least one implementation worker with a complete owner envelope')
    expect(skillSystem).toContain('Delegation never requires parallelism')
    expect(skillSystem).toContain('This observability is response-only and creates no controller state')
  })

  it('blocks implicit dirty-path ownership transfer between WorkRefs', () => {
    for (const body of [skill, managed, fallback]) {
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
    expect(fallback).toContain('insufficient ownership evidence stops the transition')
  })

  it('reuses Manage Intake selection after progress without persisting orchestration state', () => {
    expectSemanticGroup(managed, [
      ['transient authority envelope'],
      ['returns to Core at an owner boundary or resume'],
      ['re-read `rsp status --json`'],
      ['apply Intake selection again'],
      ['rerun QUALIFY'],
      ['clear in-scope ready successor'],
      ['Clearly missing ownership'],
      ['Core requalifies without another authorization round'],
      ['public-interface'],
      ['external-action'],
    ])
    expectSemanticGroup(managed, [
      ['Never persist the goal envelope, WorkSet, waves'],
      ['discovery classification', 'discovered-work classification'],
    ])
    expect(manageSkill).toContain('Never persist a paused state, worker registry, controller ledger, or execution chronology')
    expect(manageSkill).toContain('Keep counts and correction chronology transient')
  })

  it('returns in-scope managed review findings to bounded convergence', () => {
    expectSemanticGroup(manageSkill, [
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
    expect(manageSkill).toContain('three Resolve Findings passes per Change')
    expect(manageSkill).toContain('same Finding remains after two completed corrections')
    expect(manageSkill).toContain('counts and correction chronology transient')
    expect(managed).not.toContain('three Resolve Findings passes per Change')
    expect(fallback).not.toContain('three Resolve Findings passes per Change')
    expect(fallback).toContain('never dispatch, auto-continue successors, loop review corrections')
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
    let cursor = -1
    for (const field of continuationFields) {
      const next = skill.indexOf(`\`${field}\``)
      expect(next).toBeGreaterThan(cursor)
      cursor = next
    }

    expect(skill).toContain('Response-only Continuation and Durable Decision labels are not canonical artifact headings')
    expect(skill).toContain('`决策记录（Decision Record）`')
    expect(skill).toContain('<No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>')
    expect(skill).toContain('<yes | no>')
  })

  it('prohibits inferred delivery and lifecycle actions', () => {
    expect(skill).toContain('Do not infer implementation, review, Git, publication, or approval authority')
    expect(skill).toMatch(/does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority/)
    expect(skill).toContain('`rsp-manage` solely owns interruption and resume, convergence, lifecycle and commit execution detail')
    expect(manageSkill).toContain('inspect the complete lifecycle diff')
    expect(manageSkill).toContain('after Core durable review run `rsp archive <change-work-ref>`')
    expect(manageSkill).toContain('`rsp group close <group>`')
    expect(manageSkill).toContain('Terminal small owners default to no commit')
    expect(manageSkill).toContain('qualified `local` terminal non-small Change or Group')
    expect(manageSkill).toContain('routes exactly once to `rsp-commit`')
    expect(manageSkill).toContain('do not require the user to repeat `commit`')
    expect(manageSkill).toContain('An ambiguous, mixed, stale, or denied boundary stops without staging')
    expect(manageSkill).toContain('Push is opt-in only when user explicitly mentions push')
    expect(manageSkill).toContain('Never force-push')
    expect(manageSkill).toContain('`manual` grants neither automatic archive nor commit')
    expect(manageSkill).toContain('`lifecycle` grants lifecycle closeout after Core durable review but no Git action')
    expect(manageSkill).toContain('`local` grants lifecycle closeout, separately justified recovery checkpoints, and the deterministic terminal route below')
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
    expect(fallback).toContain('Every `manage.closeout` preset stays advisory because fallback Core never selects or qualifies Manage')
  })

  it('routes an authorized RSP-owned local boundary to Commit with an equivalent manual fallback', () => {
    expect(skill).toContain('route exact staging, structured message construction, local commit execution, and post-commit observation to `rsp-commit`')
    expect(durable).toContain('one envelope containing the Change, Group/wave, or confirmed release owner')
    expect(durable).toContain('stage only allowed paths')
    expect(durable).toContain('repository-consistent Conventional subject plus a proportionate body and truthful RSP trailers')
    expect(durable).toContain('observe its complete message, paths, remaining worktree, and remote safety')
    expect(manageSkill).toContain('routes exactly once to `rsp-commit`')
    expect(manageSkill).toContain('use Core fallback if Commit is unavailable')
    expect(fallback).toContain('this minimal fallback still grants and executes no Git action')
  })
})
