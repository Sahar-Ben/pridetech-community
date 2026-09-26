/* The one seam between the events screens and the response sheets living in
   other Drive files. Attaching a sheet is the only thing in this app that
   reaches outside the Dashboard spreadsheet, and it can only reach a file the
   organiser has just picked: the `drive.file` grant is what the Google Picker
   hands over, file by file.

   Picking resolves to `undefined` when the organiser closed the picker without
   choosing, which is an answer rather than a failure. */
export type PickedResponseSpreadsheet = {
  spreadsheetId: string
  name: string | undefined
}

export type ResponseSheetAccess = {
  pickSpreadsheet: () => Promise<PickedResponseSpreadsheet | undefined>
  readTabNames: (options: { spreadsheetId: string }) => Promise<readonly string[]>
  readHeaderRow: (options: {
    spreadsheetId: string
    sheetName: string
  }) => Promise<readonly string[]>
  readRows: (options: {
    spreadsheetId: string
    sheetName: string
  }) => Promise<readonly (readonly string[])[]>
}
