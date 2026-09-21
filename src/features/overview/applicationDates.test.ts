import { describe, expect, it } from 'vitest'
import { buildEarliestApplicationIndex } from './applicationDates'
import { buildLead } from '../../testing/leadFactory'

describe('buildEarliestApplicationIndex', () => {
  it('should date an applicant from their application', () => {
    const index = buildEarliestApplicationIndex([
      buildLead({ email: 'dana@example.com', timestamp: '3/8/2025' }),
    ])

    expect(index.get('dana@example.com')?.getMonth()).toBe(2)
  })

  it('should match an address whose case and spacing differ between the two tabs', () => {
    const index = buildEarliestApplicationIndex([
      buildLead({ email: '  Dana@Example.COM ', timestamp: '3/8/2025' }),
    ])

    expect(index.get('dana@example.com')).toBeDefined()
  })

  it('should date somebody who applied more than once from their first application', () => {
    const index = buildEarliestApplicationIndex([
      buildLead({ rowNumber: 2, email: 'dana@example.com', timestamp: '6/1/2024' }),
      buildLead({ rowNumber: 3, email: 'dana@example.com', timestamp: '1/9/2021' }),
    ])

    expect(index.get('dana@example.com')?.getFullYear()).toBe(2021)
  })

  it('should leave out an application whose stamp cannot be read as a date', () => {
    const index = buildEarliestApplicationIndex([
      buildLead({ email: 'dana@example.com', timestamp: 'some time in 2019' }),
    ])

    expect(index.has('dana@example.com')).toBe(false)
  })

  it('should still date an applicant whose other application has an unreadable stamp', () => {
    const index = buildEarliestApplicationIndex([
      buildLead({ rowNumber: 2, email: 'dana@example.com', timestamp: undefined }),
      buildLead({ rowNumber: 3, email: 'dana@example.com', timestamp: '1/9/2021' }),
    ])

    expect(index.get('dana@example.com')?.getFullYear()).toBe(2021)
  })
})
