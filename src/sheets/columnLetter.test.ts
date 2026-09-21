import { describe, expect, it } from 'vitest'
import { toColumnLetter } from './columnLetter'

describe('toColumnLetter', () => {
  it('should convert the first column to A', () => {
    expect(toColumnLetter(0)).toBe('A')
  })

  it('should convert the 26th column to Z', () => {
    expect(toColumnLetter(25)).toBe('Z')
  })

  it('should convert the 27th column to AA, where naive base-26 produces A@', () => {
    expect(toColumnLetter(26)).toBe('AA')
  })

  it('should convert the 28th column to AB', () => {
    expect(toColumnLetter(27)).toBe('AB')
  })

  it('should convert the 52nd column to AZ', () => {
    expect(toColumnLetter(51)).toBe('AZ')
  })

  it('should convert the 53rd column to BA', () => {
    expect(toColumnLetter(52)).toBe('BA')
  })

  it('should refuse a negative column rather than return a nonsense letter', () => {
    expect(() => toColumnLetter(-1)).toThrow(/column/i)
  })

  it('should refuse a fractional column rather than round it into the wrong cell', () => {
    expect(() => toColumnLetter(1.5)).toThrow(/column/i)
  })
})
