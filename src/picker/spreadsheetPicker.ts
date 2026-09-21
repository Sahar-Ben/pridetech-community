/* The single seam over the Google Picker: the app asks for a spreadsheet and is
   told the id, the cancellation or the failure. Nothing above this reaches for
   the `gapi` or `google.picker` globals. */
export type PickSpreadsheet = (options: {
  accessToken: string
  onPicked: (spreadsheetId: string) => void
  onCancelled: () => void
  onError: (message: string) => void
}) => void
