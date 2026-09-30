import { describe, expect, it } from 'vitest'
import { hash } from '../../skills/runner/core/files.mjs'
import { createReviewPacket } from '../../skills/runner/graders/packet.mjs'

describe('blind delivery evidence', () => {
  it('projects actual committed boundaries and prior staging without leaking composition commit identities', () => {
    const oldHead = 'a'.repeat(40)
    const head = 'b'.repeat(40)
    const before = { tree: { 'src/price.mjs': '100644 old', 'notes.txt': '100644 note', '.agents/skills/private/SKILL.md': '100644 hidden' }, index: { 'src/price.mjs': ['100644 new 0'], 'notes.txt': ['100644 note 0'], '.agents/skills/private/SKILL.md': ['100644 hidden 0'] }, headLog: [oldHead] }
    const after = { tree: { ...before.tree, 'src/price.mjs': '100644 new' }, index: before.index, parents: [oldHead], headLog: [head, oldHead], message: 'fix(price): approved value', committedContentHashes: { 'src/price.mjs': hash('export const value = 1500\n') } }
    const observation = { head, baselineHead: oldHead, git: after, baselineGit: before, changedPaths: [], files: {}, baseline: {}, artifacts: { 'src/price.mjs': 'export const value = 1500\n' }, status: ' M notes.txt', diff: '' }
    const packet = createReviewPacket({ prompt: 'Commit only price.', observation, result: { finalOutput: `Committed ${head.slice(0, 7)}` }, rubric: [], events: { commands: [], writes: [], events: [], completed: true, parseFailures: [], pendingToolCalls: 0 } })
    expect(packet.evidence.gitDelivery).toMatchObject({ head: '[new-commit]', directSuccessor: true, headMoves: 1, extendsOriginalHistory: true, message: after.message, committedPaths: ['src/price.mjs'], committedFilesMatchWorktree: { 'src/price.mjs': true }, stagedPathsBefore: ['src/price.mjs'], stagedPathsAfter: [], remainingWorktreeStatus: ' M notes.txt' })
    expect(packet.evidence.finalOutput).toBe('Committed [new-commit]')
    expect(JSON.stringify(packet)).not.toContain(head)
    expect(JSON.stringify(packet.evidence.gitDelivery)).not.toContain('private')
    after.committedContentHashes['src/price.mjs'] = hash('wrong committed bytes')
    const wrong = createReviewPacket({ prompt: 'Commit only price.', observation, result: {}, rubric: [], events: { commands: [], writes: [], events: [] } })
    expect(wrong.evidence.gitDelivery.committedFilesMatchWorktree['src/price.mjs']).toBe(false)
  })
})
