import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const skill = join(root, 'skills', 'rsp-implement')
function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-implement Skill contract', () => {
  it('keeps one portable published payload and its adaptation notice', () => {
    const body = readSkill()
    expect(body).toContain('# RSP Implement')
    expect(readFileSync(join(skill, 'NOTICE.md'), 'utf8')).toContain('d884ae04edebef577e82ff7c4e143debd0bbec99')
  })

  it('keeps only the demonstrated implementation delta and hard boundaries', () => {
    const body = readSkill()
    expect(body).toContain('Use normal repository discovery')
    expect(body).toContain('Preserve unrelated modified, staged, and untracked work')
    expect(body).toContain('discard, guess, or rewrite pre-existing intent')
    expect(body).toContain('require separate explicit authority')
    expect(body).toContain('failed or unavailable verification cannot support completion')
    expect(body).toContain('use unavailable when a missing tool, dependency, service, credential, or environment')
    expect(body).toContain('Use blocked only when scoped checks pass')
    expect(body).toContain('confirmed pre-existing or out-of-scope baseline defect')
    expect(body).toContain('Claim completion only when required Tasks and checks pass')
    expect(body).not.toMatch(/resolve-context|first backticked|Outcome:|tee \/dev\/null|provider matrix|research\//i)
  })

  it('classifies implementation evidence without recursively invoking optional disciplines', () => {
    const body = readSkill()

    expect(body).toContain('## Classify implementation evidence')
    expect(body).toContain('unexplained failure')
    expect(body).toContain('`rsp-diagnose`')
    expect(body).toContain('manual diagnosis fallback')
    expect(body).toContain('`rsp-tdd`')
    expect(body).toContain('manual TDD fallback')
    expect(body).toContain('ordinary implementation')
    expect(body).toContain('Otherwise, sufficiently evidenced behavior, cause, and owner → continue ordinary implementation')
    expect(body).toContain('explicitly required by the user, selected Change, or project instructions')
    expect(body).toContain('concrete changed risk')
    expect(body).toContain('Behavior being testable, a test being possible, or the work being a fix is not sufficient')
    expect(body).toContain('Fresh verification is required, but a new test is only one evidence option')
    expect(body).toContain('protects observable behavior or a real boundary')
    expect(body).toContain('adds distinct future confidence')
    expect(body).toContain('avoids duplicate or implementation-detail coverage')
    expect(body).toContain('proportionate maintenance cost')
    expect(body).toContain('remove the disposable test, fixture, and helper before completion')
    expect(body).toContain('User, Change, and project retention requirements remain authoritative')
    expect(body).toContain('Do not invoke another Skill from inside this Skill')
    expect(body).toContain('Do not reproduce either discipline inside Implement')
    expect(body).toContain('same selected Change')
  })

  it('admits only reachable boundaries and independently valuable permanent tests', () => {
    const body = readSkill()

    expect(body).toContain('## Admit boundaries and permanent tests')
    expect(body).toContain('current producer, production consumer, actual trust or lifecycle transition, and material consequence')
    expect(body).toContain('test/document-only consumer does not establish a production boundary')
    expect(body).toContain('observable consequence, one distinct plausible regression in the owning production seam')
    expect(body).toContain('why existing evidence misses it')
    expect(body).toContain('Do not add one test per touched file, wrapper, forwarding hop, branch, or shared constant')
    expect(body).toContain('Multiple nearby tests remain justified when each protects an independent consequence')
    expect(body).toContain('still satisfies the admission evidence')
  })

  it('finalizes changed surfaces from the accepted result without losing required facts', () => {
    const body = readSkill()

    expect(body).toContain('changed comments, test names, documentation, and handoff prose')
    expect(body).toContain('accepted result and each surface\'s authoritative baseline')
    expect(body).toContain('Build the final handoff only from the accepted Change, actual changed paths, final verification')
    expect(body).toContain('material omissions or risks, executed external actions')
    expect(body).toContain('is not an omission or boundary')
    expect(body).toContain('do not name it, paraphrase it')
    expect(body).toContain('unrequested `did not add` or `did not use` compliance claim')
    expect(body).toContain('reader without the session')
    expect(body).toContain('actual baseline removal, safety or compatibility boundary')
    expect(body).toContain('failed external action, unresolved risk')
    expect(body).toContain('Preserve required facts and pre-existing user work')
    expect(body).toContain('never change executable behavior, public contracts, tests, snapshots, or diagnostics merely to clean wording')
  })
})
