import { describe, expect, it } from 'vitest'
import { toGenderCell } from './genderCell'

describe('toGenderCell', () => {
  it('should write the gender the reviewer chose', () => {
    expect(toGenderCell('F')).toBe('F')
    expect(toGenderCell('M')).toBe('M')
  })

  it('should write nothing rather than a guess when the reviewer chose unknown', () => {
    expect(toGenderCell('unknown')).toBe('')
  })
})
