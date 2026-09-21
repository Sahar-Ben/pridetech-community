/* The name is whatever the picker called the file and is allowed to be absent:
   it is shown to the reader and never used to address anything, so a pick that
   arrives without one still selects the spreadsheet. */
export type PickedSpreadsheet = {
  spreadsheetId: string
  name: string | undefined
}

/* The single seam over the Google Picker: the app asks for a spreadsheet and is
   told the file, the cancellation or the failure. Nothing above this reaches
   for the `gapi` or `google.picker` globals. */
export type PickSpreadsheet = (options: {
  accessToken: string
  onPicked: (spreadsheet: PickedSpreadsheet) => void
  onCancelled: () => void
  onError: (message: string) => void
}) => void
