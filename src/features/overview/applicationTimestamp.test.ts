import { describe, expect, it } from 'vitest'
import { toApplicationDate } from './applicationTimestamp'

describe('toApplicationDate', () => {
  it('should read the month-first stamp the Google Form writes', () => {
    const applied = toApplicationDate('3/8/2025 14:25:20')

    expect(applied?.getFullYear()).toBe(2025)
    expect(applied?.getMonth()).toBe(2)
    expect(applied?.getDate()).toBe(8)
  })

  it('should read a stamp with no time on it', () => {
    expect(toApplicationDate('12/31/2021')?.getDate()).toBe(31)
  })

  it('should read a stamp already written the ISO way', () => {
    const applied = toApplicationDate('2022-07-04')

    expect(applied?.getFullYear()).toBe(2022)
    expect(applied?.getMonth()).toBe(6)
    expect(applied?.getDate()).toBe(4)
  })

  it('should refuse a stamp whose month could never be a month', () => {
    expect(toApplicationDate('13/8/2025')).toBeUndefined()
  })

  it('should refuse a day the month does not have', () => {
    expect(toApplicationDate('2/30/2025')).toBeUndefined()
  })

  it('should refuse free text rather than guessing a date out of it', () => {
    expect(toApplicationDate('last spring')).toBeUndefined()
  })

  it('should refuse a stamp that was never written', () => {
    expect(toApplicationDate(undefined)).toBeUndefined()
  })

  it('should refuse a blank cell', () => {
    expect(toApplicationDate('   ')).toBeUndefined()
  })
})
