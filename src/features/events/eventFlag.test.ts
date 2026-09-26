import { describe, expect, it } from 'vitest'
import { readRecordedFlag, toRecordedFlag } from './eventFlag'

describe('toRecordedFlag', () => {
  it('should record a flag that is set as a word a person can read in the cell', () => {
    expect(toRecordedFlag(true)).toBe('Yes')
  })

  it('should record a flag that is not set rather than leave the cell blank', () => {
    expect(toRecordedFlag(false)).toBe('No')
  })
})

describe('readRecordedFlag', () => {
  it('should read the word this app writes', () => {
    expect(readRecordedFlag('Yes')).toBe(true)
  })

  it('should read a blank cell as not set, which is what an untouched column is', () => {
    expect(readRecordedFlag(undefined)).toBe(false)
    expect(readRecordedFlag('')).toBe(false)
  })

  it('should read No as not set', () => {
    expect(readRecordedFlag('No')).toBe(false)
  })

  it('should read the ways a person ticks a cell by hand', () => {
    expect(['yes', 'Y', 'TRUE', 'x', '1', '\u{2713}'].map(readRecordedFlag)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
    ])
  })

  it('should read a cell holding something else as not set rather than guess', () => {
    expect(readRecordedFlag('maybe')).toBe(false)
  })
})
