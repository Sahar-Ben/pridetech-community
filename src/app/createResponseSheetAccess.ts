import type {
  PickedResponseSpreadsheet,
  ResponseSheetAccess,
} from '../features/events/responseSheetAccess'
import type { PickSpreadsheet } from '../picker/spreadsheetPicker'
import { toRangeTabName } from '../sheets/rangeTabName'
import type { CreateSheetsClient, SheetsClient } from '../sheets/sheetsClient'

const HEADER_ROW_RANGE_END = 'Z1'

/* The Picker speaks in callbacks and the attach screen is a sequence of steps,
   so the callbacks are turned into one promise here rather than in a component.
   A cancellation resolves and a failure rejects, because the screen treats them
   differently: one leaves the organiser where they were, the other has
   something to tell them. */
const toPickPromise =
  ({
    pickSpreadsheet,
    accessToken,
  }: {
    pickSpreadsheet: PickSpreadsheet
    accessToken: string
  }): (() => Promise<PickedResponseSpreadsheet | undefined>) =>
  async () =>
    await new Promise<PickedResponseSpreadsheet | undefined>((resolve, reject) => {
      pickSpreadsheet({
        accessToken,
        onPicked: (spreadsheet) => {
          resolve({ spreadsheetId: spreadsheet.spreadsheetId, name: spreadsheet.name })
        },
        onCancelled: () => {
          resolve(undefined)
        },
        onError: (message) => {
          reject(new Error(message))
        },
      })
    })

export const createResponseSheetAccess = ({
  pickSpreadsheet,
  accessToken,
  createClient,
}: {
  pickSpreadsheet: PickSpreadsheet
  accessToken: string
  createClient: CreateSheetsClient
}): ResponseSheetAccess => {
  const clientFor = (spreadsheetId: string): SheetsClient =>
    createClient({ spreadsheetId, getAccessToken: () => accessToken })

  return {
    pickSpreadsheet: toPickPromise({ pickSpreadsheet, accessToken }),

    readTabNames: async ({ spreadsheetId }) => await clientFor(spreadsheetId).readTabNames(),

    /* A response sheet's tab is named by whoever made the Google Form, so the
       name is quoted before it becomes a range: `Form Responses 1!A1` is not a
       reference Sheets can read. */
    readHeaderRow: async ({ spreadsheetId, sheetName }) => {
      const rows = await clientFor(spreadsheetId).readRange({
        range: `${toRangeTabName(sheetName)}!A1:${HEADER_ROW_RANGE_END}`,
      })
      return rows[0] ?? []
    },
  }
}
