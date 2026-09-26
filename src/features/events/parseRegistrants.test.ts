import { describe, expect, it } from 'vitest'
import { mergeRepeatedRegistrants, parseSheetRegistrants } from './parseRegistrants'
import { buildRegistrant } from '../../testing/eventFactory'
import { buildAttachedSheet } from '../../testing/eventsRegistryFactory'

const HEADER = ['Timestamp', 'Name', 'Email', 'Company']

const sheet = buildAttachedSheet({ eventId: 'evt-1' })

const parse = (rows: readonly (readonly string[])[], overrides = {}) => {
  const attached = { ...sheet, ...overrides }
  return parseSheetRegistrants({
    sheet: attached,
    mapping: attached.mapping ?? {},
    rows: [HEADER, ...rows],
  })
}

describe('parseSheetRegistrants', () => {
  it('should read each response row as a registrant through the mapping', () => {
    const { registrants } = parse([
      ['9/1/2026 10:00:00', 'Dana Sorkin', 'Dana.Sorkin@Example.com', 'Fennimore Labs'],
    ])

    expect(registrants).toEqual([
      {
        id: 'responses-1/Form Responses 1/2',
        eventId: 'evt-1',
        name: 'Dana Sorkin',
        email: 'Dana.Sorkin@Example.com',
        company: 'Fennimore Labs',
        jobTitle: undefined,
        registration: 'registered',
        checkedInAt: undefined,
        guestOfEmail: undefined,
        isWalkIn: false,
      },
    ])
  })

  it('should read a waiting-list sheet as people on the waitlist', () => {
    const { registrants } = parse([['', 'Noa Feldman', 'noa@example.com', '']], {
      role: 'waiting list',
    })

    expect(registrants.map((registrant) => registrant.registration)).toEqual(['waitlist'])
  })

  it('should skip a blank row without reporting it and keep later row numbers true', () => {
    const { registrants, rowsWithoutNameOrEmail } = parse([
      ['', '', '', ''],
      ['', 'Noa Feldman', 'noa@example.com', ''],
    ])

    expect(registrants.map((registrant) => registrant.id)).toEqual([
      'responses-1/Form Responses 1/3',
    ])
    expect(rowsWithoutNameOrEmail).toEqual([])
  })

  it('should name somebody by their email when the name cell is empty', () => {
    const { registrants } = parse([['9/1/2026', '', 'noa@example.com', '']])

    expect(registrants[0]?.name).toBe('noa@example.com')
  })

  it('should report a row that has neither a name nor an email rather than invent a person', () => {
    const { registrants, rowsWithoutNameOrEmail } = parse([['9/1/2026', '', '', 'Playtika']])

    expect(registrants).toEqual([])
    expect(rowsWithoutNameOrEmail).toEqual([2])
  })

  it('should read a sheet that never asked for an email by name alone', () => {
    const { registrants } = parse([['', 'Dana Sorkin', 'ignored', '']], {
      mapping: { name: 1 },
    })

    expect(registrants.map(({ name, email }) => ({ name, email }))).toEqual([
      { name: 'Dana Sorkin', email: undefined },
    ])
  })
})

describe('mergeRepeatedRegistrants', () => {
  it('should keep the first of two submissions with the same email, whatever its case', () => {
    const first = buildRegistrant({ id: 'row-2', email: 'dana@example.com' })
    const second = buildRegistrant({ id: 'row-5', email: ' DANA@example.com ' })

    expect(mergeRepeatedRegistrants([first, second])).toEqual({
      registrants: [first],
      repeatedCount: 1,
    })
  })

  it('should keep the place rather than the waiting-list entry for the same person', () => {
    const waiting = buildRegistrant({ id: 'wait-2', email: 'dana@example.com', registration: 'waitlist' })
    const holding = buildRegistrant({ id: 'main-9', email: 'dana@example.com' })
    const other = buildRegistrant({ id: 'main-3', email: 'noa@example.com' })

    expect(mergeRepeatedRegistrants([waiting, other, holding])).toEqual({
      registrants: [holding, other],
      repeatedCount: 1,
    })
  })

  it('should never merge two people who gave no email, even under one name', () => {
    const first = buildRegistrant({ id: 'row-2', name: 'Dana', email: undefined })
    const second = buildRegistrant({ id: 'row-3', name: 'Dana', email: undefined })

    expect(mergeRepeatedRegistrants([first, second])).toEqual({
      registrants: [first, second],
      repeatedCount: 0,
    })
  })
})
