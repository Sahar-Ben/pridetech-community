import { describe, expect, it } from 'vitest'
import {
  describeReadNotes,
  describeReadingSheets,
  describeSheetReadProblem,
} from './registrantsReadText'
import { buildAttachedSheet } from '../../testing/eventsRegistryFactory'

const sheet = buildAttachedSheet({ sheetName: 'Form Responses 1' })

const emptyRead = {
  registrants: [],
  repeatedCount: 0,
  rowsWithoutNameOrEmail: [],
  problems: [],
}

describe('describeReadingSheets', () => {
  it('should count the sheets being read', () => {
    expect(describeReadingSheets(1)).toBe('Reading registrants from 1 response sheet\u{2026}')
    expect(describeReadingSheets(2)).toBe('Reading registrants from 2 response sheets\u{2026}')
  })
})

describe('describeSheetReadProblem', () => {
  it('should tell the organiser how to give access to a sheet somebody else attached', () => {
    expect(describeSheetReadProblem({ kind: 'no-access', sheet })).toMatch(
      /"Form Responses 1" could not be opened.*picking the same file/,
    )
  })

  it('should pass on what Google said about any other failure', () => {
    expect(
      describeSheetReadProblem({ kind: 'read-failed', sheet, message: 'Unable to parse range' }),
    ).toBe('"Form Responses 1" could not be read. Unable to parse range')
  })

  it('should ask for the sheet to be attached again when its mapping is unreadable', () => {
    expect(describeSheetReadProblem({ kind: 'unreadable-mapping', sheet })).toMatch(
      /attach the sheet again/i,
    )
  })
})

describe('describeReadNotes', () => {
  it('should say nothing about a clean read', () => {
    expect(describeReadNotes(emptyRead)).toEqual([])
  })

  it('should say how many repeat submissions were counted once', () => {
    expect(describeReadNotes({ ...emptyRead, repeatedCount: 1 })).toEqual([
      '1 repeat submission with an email already on the list was counted once.',
    ])
    expect(describeReadNotes({ ...emptyRead, repeatedCount: 3 })).toEqual([
      '3 repeat submissions with an email already on the list were counted once.',
    ])
  })

  it('should name the rows left out for having neither a name nor an email', () => {
    expect(
      describeReadNotes({ ...emptyRead, rowsWithoutNameOrEmail: [{ sheet, rowNumbers: [4, 9] }] }),
    ).toEqual([
      'Rows 4, 9 of "Form Responses 1" have neither a name nor an email, so they are left out.',
    ])
  })
})
