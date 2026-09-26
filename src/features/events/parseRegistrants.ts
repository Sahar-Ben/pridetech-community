import type { ResponseSheetMapping } from './responseSheetMapping'
import type { AttachedResponseSheet } from './parseAttachedSheets'
import type { RegistrationKind, Registrant } from './registrant'
import { toEmailKey } from '../../sheets/emailKey'
import { hasAnyRecordedCell, readCell } from '../../sheets/readCell'

const HEADER_ROW_COUNT = 1

/* A waiting list is a list of people who asked, not people holding a place,
   and counting them as registered would put them in the door's denominator. */
const REGISTRATION_BY_ROLE: Readonly<Record<AttachedResponseSheet['role'], RegistrationKind>> = {
  main: 'registered',
  'waiting list': 'waitlist',
}

export type ParsedSheetRegistrants = {
  registrants: readonly Registrant[]
  rowsWithoutNameOrEmail: readonly number[]
}

/* The id names the sheet and the row, not the person: it only has to stay the
   same between two reads of the same sheet, and a form only ever appends. */
const buildRegistrantId = ({
  sheet,
  rowNumber,
}: {
  sheet: AttachedResponseSheet
  rowNumber: number
}): string => `${sheet.spreadsheetId}/${sheet.sheetName}/${rowNumber}`

/* The header row is skipped by position rather than by what it says: the
   mapping was confirmed against it when the sheet was attached, and it is the
   mapping, not the heading text, that says which column is which. */
export const parseSheetRegistrants = ({
  sheet,
  mapping,
  rows,
}: {
  sheet: AttachedResponseSheet
  mapping: ResponseSheetMapping
  rows: readonly (readonly string[])[]
}): ParsedSheetRegistrants => {
  const registrants: Registrant[] = []
  const rowsWithoutNameOrEmail: number[] = []

  rows.slice(HEADER_ROW_COUNT).forEach((row, index) => {
    const rowNumber = index + HEADER_ROW_COUNT + 1
    if (!hasAnyRecordedCell(row)) {
      return
    }
    const email = readCell({ row, column: mapping.email })
    const name = readCell({ row, column: mapping.name }) ?? email
    if (name === undefined) {
      rowsWithoutNameOrEmail.push(rowNumber)
      return
    }
    registrants.push({
      id: buildRegistrantId({ sheet, rowNumber }),
      eventId: sheet.eventId,
      name,
      email,
      company: readCell({ row, column: mapping.company }),
      jobTitle: readCell({ row, column: mapping.jobTitle }),
      registration: REGISTRATION_BY_ROLE[sheet.role],
      checkedInAt: undefined,
      guestOfEmail: undefined,
      isWalkIn: false,
    })
  })

  return { registrants, rowsWithoutNameOrEmail }
}

export type MergedRegistrants = {
  registrants: readonly Registrant[]
  repeatedCount: number
}

/* One person, one row, however many times they filled the form in: somebody
   who submitted twice would otherwise be counted twice at the door, and a
   check-in on one of their rows would leave the other one waiting. A place
   beats a waiting-list entry, because a person holding a place is expected
   whatever else they submitted; otherwise the earliest submission is kept.

   Rows without an email are never merged. Two of them sharing a name could be
   two different people, and the app has nothing to tell them apart with. */
export const mergeRepeatedRegistrants = (
  registrants: readonly Registrant[],
): MergedRegistrants => {
  const keptByEmail = new Map<string, Registrant>()
  const kept: Registrant[] = []
  let repeatedCount = 0

  registrants.forEach((registrant) => {
    const emailKey = registrant.email === undefined ? '' : toEmailKey(registrant.email)
    if (emailKey === '') {
      kept.push(registrant)
      return
    }
    const earlier = keptByEmail.get(emailKey)
    if (earlier === undefined) {
      keptByEmail.set(emailKey, registrant)
      kept.push(registrant)
      return
    }
    repeatedCount += 1
    if (earlier.registration === 'waitlist' && registrant.registration === 'registered') {
      keptByEmail.set(emailKey, registrant)
      kept[kept.indexOf(earlier)] = registrant
    }
  })

  return { registrants: kept, repeatedCount }
}
