import { describe, expect, it } from 'vitest'
import { DEFAULT_REQUIRED_SECTIONS, resolvePriorities, resolveRequiredSections, resolveStatuses, VALID_PRIORITIES, VALID_STATUSES } from '../src/core/config.js'

describe('resolveStatuses', () => {
  it('returns defaults when config has no statuses', () => {
    expect(resolveStatuses({})).toEqual(VALID_STATUSES)
  })

  it('returns defaults when statuses is empty array', () => {
    expect(resolveStatuses({ statuses: [] })).toEqual(VALID_STATUSES)
  })

  it('returns custom statuses from config', () => {
    const result = resolveStatuses({ statuses: ['draft', 'review', 'done'] })
    expect(result).toEqual(['draft', 'review', 'done'])
  })
})

describe('resolvePriorities', () => {
  it('returns defaults when config has no priorities', () => {
    expect(resolvePriorities({})).toEqual(VALID_PRIORITIES)
  })

  it('returns defaults when priorities is empty array', () => {
    expect(resolvePriorities({ priorities: [] })).toEqual(VALID_PRIORITIES)
  })

  it('returns custom priorities from config', () => {
    const result = resolvePriorities({ priorities: ['low', 'critical'] })
    expect(result).toEqual(['low', 'critical'])
  })
})

describe('resolveRequiredSections', () => {
  it('returns defaults when config has no sections', () => {
    expect(resolveRequiredSections({})).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })

  it('returns defaults when sections is empty array', () => {
    expect(resolveRequiredSections({ required_sections: [] })).toEqual(DEFAULT_REQUIRED_SECTIONS)
  })

  it('returns custom sections from config', () => {
    const result = resolveRequiredSections({ required_sections: ['Spec', 'Plan', 'Tests'] })
    expect(result).toEqual(['Spec', 'Plan', 'Tests'])
  })
})
