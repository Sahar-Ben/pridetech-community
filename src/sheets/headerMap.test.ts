import { describe, expect, it } from 'vitest'
import { buildHeaderMap, findColumn } from './headerMap'

describe('buildHeaderMap', () => {
  it('should map each header to its column index when headers are unique', () => {
    const headerMap = buildHeaderMap(['Timestamp', 'Name', 'Email'])
    expect(headerMap.get('timestamp')).toBe(0)
    expect(headerMap.get('email')).toBe(2)
  })

  it('should match case-insensitively and ignore surrounding whitespace', () => {
    const headerMap = buildHeaderMap(['  TIMESTAMP ', 'arrived'])
    expect(headerMap.get('timestamp')).toBe(0)
    expect(headerMap.get('arrived')).toBe(1)
  })

  it('should collapse a run of internal whitespace to a single space', () => {
    const headerMap = buildHeaderMap(['Full  Name', 'Email'])
    expect(headerMap.get('full name')).toBe(0)
  })

  it('should treat a non-breaking space as an ordinary space', () => {
    const headerMap = buildHeaderMap(['Full\u{00a0}Name', 'Email'])
    expect(headerMap.get('full name')).toBe(0)
  })

  it('should keep the first index when a header is duplicated', () => {
    const headerMap = buildHeaderMap(['Waiting', 'Phone', 'Waiting', 'Phone'])
    expect(headerMap.get('waiting')).toBe(0)
    expect(headerMap.get('phone')).toBe(1)
  })

  it('should keep the first index when duplicated headers differ only by case', () => {
    const headerMap = buildHeaderMap(['Arrived', 'Phone', 'arrived'])
    expect(headerMap.get('arrived')).toBe(0)
  })

  it('should skip blank headers without shifting later indices', () => {
    const headerMap = buildHeaderMap(['', 'Full Name', 'Email'])
    expect(headerMap.get('full name')).toBe(1)
    expect(headerMap.get('email')).toBe(2)
  })

  it('should skip a whitespace-only header the same way it skips a blank one', () => {
    const spaceOnly = buildHeaderMap(['   ', 'Full Name'])
    expect(spaceOnly.get('')).toBeUndefined()
    expect(spaceOnly.get('full name')).toBe(1)

    const nonBreakingSpaceOnly = buildHeaderMap(['\u{00a0}', 'Full Name'])
    expect(nonBreakingSpaceOnly.get('')).toBeUndefined()
    expect(nonBreakingSpaceOnly.get('full name')).toBe(1)
  })
})

describe('findColumn', () => {
  const aliases = ['email', 'your email', 'e-mail']

  it('should find the column by any of its aliases', () => {
    const headerMap = buildHeaderMap(['Timestamp', 'Name', 'Your Email'])
    expect(findColumn({ headerMap, aliases })).toBe(2)
  })

  it('should prefer the earlier alias when the sheet has a column for more than one', () => {
    const headerMap = buildHeaderMap(['Your Email', 'Name', 'Email'])
    expect(findColumn({ headerMap, aliases })).toBe(2)
  })

  it('should normalize internal whitespace in the alias as well as the header', () => {
    const headerMap = buildHeaderMap(['Timestamp', 'Your  Email'])
    expect(findColumn({ headerMap, aliases: ['your email'] })).toBe(1)
  })

  it('should return undefined when no alias is present', () => {
    const headerMap = buildHeaderMap(['Timestamp', 'Name', 'arrived'])
    expect(findColumn({ headerMap, aliases })).toBeUndefined()
  })
})
