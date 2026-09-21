import { describe, expect, it } from 'vitest'
import { buildRemovalReasonOptions } from './memberEditOptions'

const labelsFor = (recordedReason: string | undefined): readonly string[] =>
  buildRemovalReasonOptions(recordedReason).map((option) => option.label)

describe('buildRemovalReasonOptions', () => {
  it('should offer the recorded list when nothing is recorded against the member', () => {
    expect(labelsFor(undefined)).toEqual([
      'Not recorded',
      'Left tech',
      'Requested removal',
      'Moved abroad',
      'Unreachable',
      'Code of conduct',
      'Other',
    ])
  })

  it('should not repeat a reason that is already on the list', () => {
    expect(labelsFor('Moved abroad').filter((label) => label === 'Moved abroad')).toHaveLength(1)
  })

  it('should offer back a reason somebody typed into the sheet by hand', () => {
    expect(labelsFor('Left the country')).toContain('Left the country')
  })

  it('should keep a hand-typed reason selectable rather than only readable', () => {
    const options = buildRemovalReasonOptions('Left the country')

    expect(options.at(-1)).toEqual({ value: 'Left the country', label: 'Left the country' })
  })
})
