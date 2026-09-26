import { describe, expect, it } from 'vitest'
import {
  guessResponseSheetMapping,
  hasMappedEmail,
  parseColumnMapping,
  recordColumnMapping,
} from './responseSheetMapping'

/* The shapes the community's own response sheets actually take. */
const EARLY_SHEET_WITH_NO_EMAIL = ['Timestamp', 'Full Name', 'Your Company']
const BLANK_HEADER_OVER_TIMESTAMP = ['', 'Name', 'E-Mail', 'Current Employer / Organization']
const DUPLICATE_HEADERS = ['Timestamp', 'Name', 'Email', 'Name', 'Company']

describe('guessResponseSheetMapping', () => {
  it('should find the columns a plain response sheet uses', () => {
    expect(
      guessResponseSheetMapping({
        headerRow: ['Timestamp', 'Name', 'Job Title', 'Company', 'Email'],
      }),
    ).toEqual({ timestamp: 0, name: 1, jobTitle: 2, company: 3, email: 4 })
  })

  it('should read the spellings the different forms used for one question', () => {
    expect(
      guessResponseSheetMapping({
        headerRow: ['Full Name', 'Your Company', 'Your Job Title', 'Your Email'],
      }),
    ).toEqual({ name: 0, company: 1, jobTitle: 2, email: 3 })
  })

  it('should read the longest company heading the forms ever used', () => {
    expect(
      guessResponseSheetMapping({
        headerRow: ['Current Employer / Organization / Company'],
      }),
    ).toEqual({ company: 0 })
  })

  it('should guess nothing for a column it cannot recognise rather than guess by position', () => {
    expect(guessResponseSheetMapping({ headerRow: ['Who are you', 'Where from'] })).toEqual({})
  })

  it('should leave email unguessed on the early sheets that never asked for one', () => {
    const mapping = guessResponseSheetMapping({ headerRow: EARLY_SHEET_WITH_NO_EMAIL })

    expect(mapping.email).toBe(undefined)
    expect(mapping.name).toBe(1)
  })

  it('should guess nothing for the column under a blank heading, leaving it to be chosen', () => {
    const mapping = guessResponseSheetMapping({ headerRow: BLANK_HEADER_OVER_TIMESTAMP })

    expect(mapping.timestamp).toBe(undefined)
    expect(mapping.email).toBe(2)
  })

  it('should take the leftmost of two columns with the same heading, the same way every time', () => {
    const mapping = guessResponseSheetMapping({ headerRow: DUPLICATE_HEADERS })

    expect(mapping.name).toBe(1)
    expect(guessResponseSheetMapping({ headerRow: DUPLICATE_HEADERS })).toEqual(mapping)
  })
})

describe('recordColumnMapping and parseColumnMapping', () => {
  it('should round-trip a full mapping through the cell it is stored in', () => {
    const mapping = { timestamp: 0, name: 1, jobTitle: 2, company: 3, email: 4 }

    expect(parseColumnMapping(recordColumnMapping(mapping))).toEqual(mapping)
  })

  it('should record the mapping as the column letters the organiser sees in their own sheet', () => {
    expect(recordColumnMapping({ name: 1, email: 27 })).toBe(
      '{"timestamp":null,"name":"B","email":"AB","company":null,"jobTitle":null}',
    )
  })

  it('should record a sheet with no email column as having none, rather than leave it unsaid', () => {
    const recorded = recordColumnMapping(
      guessResponseSheetMapping({ headerRow: EARLY_SHEET_WITH_NO_EMAIL }),
    )

    expect(recorded).toContain('"email":null')
    expect(hasMappedEmail(parseColumnMapping(recorded) ?? {})).toBe(false)
  })

  it('should round-trip a mapping that names no column at all', () => {
    expect(parseColumnMapping(recordColumnMapping({}))).toEqual({})
  })

  it('should read a blank cell as a mapping that names nothing', () => {
    expect(parseColumnMapping(undefined)).toEqual({})
    expect(parseColumnMapping('')).toEqual({})
  })

  it('should report a cell it cannot read rather than pass off an empty mapping as a real one', () => {
    expect(parseColumnMapping('email: column D')).toBe(undefined)
  })

  it('should ignore a column reference that is not one, rather than map a field to nowhere', () => {
    expect(parseColumnMapping('{"name":"B","email":"D4"}')).toEqual({ name: 1 })
  })

  it('should ignore a field it does not know about', () => {
    expect(parseColumnMapping('{"name":"B","shoeSize":"C"}')).toEqual({ name: 1 })
  })
})

describe('hasMappedEmail', () => {
  it('should say a sheet with an email column has one', () => {
    expect(hasMappedEmail({ email: 4 })).toBe(true)
  })

  it('should say a sheet with no email column has none, which is a real state and not a fault', () => {
    expect(hasMappedEmail({ name: 1 })).toBe(false)
  })
})
