import { describe, expect, it } from 'vitest'
import {
  isReasonChipSelected,
  REASON_CHIPS,
  toDecisionReason,
  toggleReasonChip,
} from './decisionReason'

describe('toDecisionReason', () => {
  it('should give back the reason the reviewer typed', () => {
    expect(toDecisionReason('Not in Tech')).toBe('Not in Tech')
  })

  it('should treat a reason of spaces alone as no reason at all', () => {
    expect(toDecisionReason('   ')).toBeUndefined()
  })

  it('should treat an empty field as no reason at all', () => {
    expect(toDecisionReason('')).toBeUndefined()
  })

  it('should write the reason without the spaces around it', () => {
    expect(toDecisionReason('  Not in Tech  ')).toBe('Not in Tech')
  })
})

describe('toggleReasonChip', () => {
  it('should fill an empty field with the chip the reviewer picked', () => {
    expect(toggleReasonChip({ reason: '', chip: 'Not in Tech' })).toBe('Not in Tech')
  })

  it('should add a second chip beside the first, separated by a comma', () => {
    expect(toggleReasonChip({ reason: 'Not in Tech', chip: 'Less than 3 years' })).toBe(
      'Not in Tech, Less than 3 years',
    )
  })

  it('should take a chip back out when the reviewer picks it again', () => {
    expect(
      toggleReasonChip({ reason: 'Not in Tech, Less than 3 years', chip: 'Not in Tech' }),
    ).toBe('Less than 3 years')
  })

  it('should leave the reviewer own words in place when a chip is taken out', () => {
    expect(
      toggleReasonChip({ reason: 'Not in Tech, moving abroad', chip: 'Not in Tech' }),
    ).toBe('moving abroad')
  })

  it('should keep the reviewer own words when a chip is added to them', () => {
    expect(toggleReasonChip({ reason: 'moving abroad', chip: 'Not in Tech' })).toBe(
      'moving abroad, Not in Tech',
    )
  })

  it('should empty the field when its only chip is taken back out', () => {
    expect(toggleReasonChip({ reason: 'Not in Tech', chip: 'Not in Tech' })).toBe('')
  })

  it('should not leave a stray comma behind when a chip was typed with loose spacing', () => {
    expect(toggleReasonChip({ reason: '  Not in Tech ,  moving abroad', chip: 'Not in Tech' })).toBe(
      'moving abroad',
    )
  })
})

describe('isReasonChipSelected', () => {
  it('should read a chip whose text is in the field as selected', () => {
    expect(isReasonChipSelected({ reason: 'Not in Tech, moving abroad', chip: 'Not in Tech' })).toBe(
      true,
    )
  })

  it('should read a chip whose text is absent as unselected', () => {
    expect(isReasonChipSelected({ reason: 'moving abroad', chip: 'Not in Tech' })).toBe(false)
  })

  it('should not read a chip as selected because another reason mentions its words', () => {
    expect(
      isReasonChipSelected({ reason: 'Not in Tech yet', chip: 'Not in Tech' }),
    ).toBe(false)
  })
})

describe('REASON_CHIPS', () => {
  it('should offer the three reasons an application is turned away for', () => {
    expect(REASON_CHIPS.decline).toEqual([
      'Not in Tech',
      'Less than 3 years',
      'In tech but not in the Industry',
    ])
  })

  it('should offer keeping-for-later reasons rather than the reasons for turning somebody away', () => {
    expect(REASON_CHIPS.maybe).not.toEqual(REASON_CHIPS.decline)
    expect(REASON_CHIPS.maybe.length).toBeGreaterThan(0)
  })
})
