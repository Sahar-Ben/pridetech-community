const SPREADSHEET_BASE = 'https://docs.google.com/spreadsheets/d'

/* Addressed by tab name rather than by `gid`: a tab that was deleted and rebuilt
   keeps its name and loses its id, and this link has to survive that. */
export const buildSheetRowUrl = ({
  spreadsheetId,
  tabName,
  rowNumber,
}: {
  spreadsheetId: string
  tabName: string
  rowNumber: number
}): string =>
  `${SPREADSHEET_BASE}/${spreadsheetId}/edit?range=${encodeURIComponent(`${tabName}!A${rowNumber}`)}`
