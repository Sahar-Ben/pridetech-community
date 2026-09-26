import type { AttachedResponseSheet } from './parseAttachedSheets'
import { mergeRepeatedRegistrants, parseSheetRegistrants } from './parseRegistrants'
import type { Registrant } from './registrant'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { describeError } from '../../errors/describeError'
import { isExpiredSessionError, SheetsRequestError } from '../../sheets/sheetsRequestError'

const NOT_FOUND_STATUS = 404
const FORBIDDEN_STATUS = 403

/* One sheet failing does not take the others down with it: an event with a
   main sheet and a waiting list is still worth showing when only the waiting
   list is out of reach, as long as the screen says which one is missing.

   `no-access` is kept apart because it has its own cure. The app only holds a
   `drive.file` grant, which reaches the files the signed-in organiser picked
   themselves, so a sheet somebody else attached is out of reach until this
   organiser picks it too. Google answers that with a 404 as readily as a 403,
   and a deleted file looks the same, so both are read as "out of reach". */
export type SheetReadProblem =
  | { kind: 'no-access'; sheet: AttachedResponseSheet }
  | { kind: 'unreadable-mapping'; sheet: AttachedResponseSheet }
  | { kind: 'read-failed'; sheet: AttachedResponseSheet; message: string }

export type SheetRowsWithoutNameOrEmail = {
  sheet: AttachedResponseSheet
  rowNumbers: readonly number[]
}

export type EventRegistrantsRead = {
  registrants: readonly Registrant[]
  repeatedCount: number
  rowsWithoutNameOrEmail: readonly SheetRowsWithoutNameOrEmail[]
  problems: readonly SheetReadProblem[]
}

type SheetOutcome =
  | { kind: 'read'; sheet: AttachedResponseSheet; rows: readonly (readonly string[])[] }
  | { kind: 'problem'; problem: SheetReadProblem }

const isOutOfReach = (error: unknown): boolean =>
  error instanceof SheetsRequestError &&
  (error.status === FORBIDDEN_STATUS || error.status === NOT_FOUND_STATUS)

const readSheet = async ({
  access,
  sheet,
}: {
  access: ResponseSheetAccess
  sheet: AttachedResponseSheet
}): Promise<SheetOutcome> => {
  if (sheet.mapping === undefined) {
    return { kind: 'problem', problem: { kind: 'unreadable-mapping', sheet } }
  }
  try {
    const rows = await access.readRows({
      spreadsheetId: sheet.spreadsheetId,
      sheetName: sheet.sheetName,
    })
    return { kind: 'read', sheet, rows }
  } catch (error: unknown) {
    if (isExpiredSessionError(error)) {
      throw error
    }
    if (isOutOfReach(error)) {
      return { kind: 'problem', problem: { kind: 'no-access', sheet } }
    }
    return {
      kind: 'problem',
      problem: {
        kind: 'read-failed',
        sheet,
        message: describeError({ error, fallback: 'Google gave no detail.' }),
      },
    }
  }
}

/* Main sheets are read into the list before waiting lists, so the merge meets
   somebody's place first and a repeat on the waiting list is the one dropped. */
const mainSheetsFirst = (sheets: readonly AttachedResponseSheet[]): readonly AttachedResponseSheet[] =>
  sheets.toSorted(
    (earlier, later) => Number(earlier.role !== 'main') - Number(later.role !== 'main'),
  )

export const loadEventRegistrants = async ({
  access,
  sheets,
}: {
  access: ResponseSheetAccess
  sheets: readonly AttachedResponseSheet[]
}): Promise<EventRegistrantsRead> => {
  const outcomes = await Promise.all(
    mainSheetsFirst(sheets).map(async (sheet) => await readSheet({ access, sheet })),
  )

  const parsed = outcomes.flatMap((outcome) =>
    outcome.kind === 'read' && outcome.sheet.mapping !== undefined
      ? [
          {
            sheet: outcome.sheet,
            ...parseSheetRegistrants({
              sheet: outcome.sheet,
              mapping: outcome.sheet.mapping,
              rows: outcome.rows,
            }),
          },
        ]
      : [],
  )

  const merged = mergeRepeatedRegistrants(parsed.flatMap((read) => read.registrants))

  return {
    registrants: merged.registrants,
    repeatedCount: merged.repeatedCount,
    rowsWithoutNameOrEmail: parsed
      .filter((read) => read.rowsWithoutNameOrEmail.length > 0)
      .map((read) => ({ sheet: read.sheet, rowNumbers: read.rowsWithoutNameOrEmail })),
    problems: outcomes.flatMap((outcome) => (outcome.kind === 'problem' ? [outcome.problem] : [])),
  }
}
