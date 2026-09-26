import { describe, expect, it } from 'vitest'
import { toRangeTabName } from './rangeTabName'

describe('toRangeTabName', () => {
  it('should leave a plain tab name alone, so existing ranges keep the spelling they already have', () => {
    expect(toRangeTabName('Members')).toBe('Members')
  })

  it('should quote a tab name holding a space, which A1 notation cannot read unquoted', () => {
    expect(toRangeTabName('Event sheets')).toBe("'Event sheets'")
  })

  it('should quote a tab name a response sheet arrives with', () => {
    expect(toRangeTabName('Form Responses 1')).toBe("'Form Responses 1'")
  })

  it('should double an apostrophe inside a quoted tab name', () => {
    expect(toRangeTabName("Dana's list")).toBe("'Dana''s list'")
  })

  it('should quote a tab name that reads as a cell reference, which would otherwise address a cell', () => {
    expect(toRangeTabName('A1')).toBe("'A1'")
  })

  it('should leave a tab name of letters, digits and underscores alone', () => {
    expect(toRangeTabName('Events_2026')).toBe('Events_2026')
  })
})
