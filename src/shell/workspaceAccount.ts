import type { ScreenLock } from '../lock/useScreenLock'

/* What the rail's footer needs to show and to do. It travels from the top of
   the app down through the shell because none of it belongs to a section: the
   spreadsheet a workspace is pointed at, and the two acts that change or end
   the session it is being read with. */
export type WorkspaceAccount = {
  spreadsheetName: string | undefined
  /* Absent on a device that cannot unlock with Face ID, Touch ID or a passcode. */
  screenLock?: ScreenLock
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}
