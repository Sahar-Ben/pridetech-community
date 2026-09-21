export type ConnectionState = 'signed-out' | 'needs-spreadsheet' | 'ready'

export const resolveConnectionState = ({
  accessToken,
  spreadsheetId,
}: {
  accessToken: string | undefined
  spreadsheetId: string | undefined
}): ConnectionState => {
  if (accessToken === undefined) {
    return 'signed-out'
  }
  if (spreadsheetId === undefined) {
    return 'needs-spreadsheet'
  }
  return 'ready'
}
