import { describe, expect, it } from 'vitest'
import { toColumnIndex } from './columnIndex'
import { toColumnLetter } from './columnLetter'

describe('toColumnIndex', () => {
  it('should read A as the first column', () => {
    expect(toColumnIndex('A')).toBe(0)
  })

  it('should read Z as the 26th column', () => {
    expect(toColumnIndex('Z')).toBe(25)
  })

  it('should read AA as the 27th column, where naive base-26 reads it as the 26th', () => {
    expect(toColumnIndex('AA')).toBe(26)
  })

  it('should read a lower case letter, since a mapping can be typed into the sheet by hand', () => {
    expect(toColumnIndex('ab')).toBe(27)
  })

  it('should refuse a letter run that is not a column reference', () => {
    expect(toColumnIndex('A1')).toBeUndefined()
  })

  it('should refuse an empty reference', () => {
    expect(toColumnIndex('')).toBeUndefined()
  })

  it('should round-trip every column letter this app can address', () => {
    const everyIndex = Array.from({ length: 200 }, (_column, index) => index)

    expect(everyIndex.map((index) => toColumnIndex(toColumnLetter(index)))).toEqual(everyIndex)
  })
})
