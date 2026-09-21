import type { WorkspaceAccount } from './workspaceAccount'

/* Pinned to the bottom and behind a rule, because these are not a fifth and
   sixth destination: one of them re-points the whole app and the other ends the
   session, and both are used once a day at most. */
const FOOTER_CLASSES = 'mt-auto flex flex-col gap-2 border-t border-glass-edge px-2 pt-3 pb-1'

/* Quieter than a nav item by weight and shape rather than by a dimmed white:
   white at anything under full alpha is the one ink this glass cannot carry. */
const CHANGE_BUTTON_CLASSES = [
  'w-full rounded-full px-2 py-1.5 text-left text-sm font-medium text-on-brand',
  'transition-colors duration-150 ease-brand hover:bg-glass-hover',
].join(' ')

/* Outlined where its neighbour is bare. They sit next to each other and one of
   them throws the session away, so they must not be the same object twice. */
const SIGN_OUT_BUTTON_CLASSES = [
  'self-start rounded-full border border-glass-edge px-3 py-1 text-xs font-semibold',
  'text-on-brand transition-colors duration-150 ease-brand hover:bg-glass-hover',
].join(' ')

type SidebarFooterProps = {
  account: WorkspaceAccount
}

export const SidebarFooter = ({ account }: SidebarFooterProps) => (
  <div className={FOOTER_CLASSES}>
    <button className={CHANGE_BUTTON_CLASSES} onClick={account.onChangeSpreadsheet} type="button">
      Change spreadsheet
      {/* The name of the sheet being written to, under the control that changes
          it: an approval writes for real, and a copy named WRITE TEST is only
          obvious if it is on screen. Absent until the next pick for anybody
          whose spreadsheet was chosen before this was stored, and an id in its
          place would say nothing a reader could act on. */}
      {account.spreadsheetName !== undefined && (
        <span className="mt-0.5 block truncate text-xs font-semibold">
          {account.spreadsheetName}
        </span>
      )}
    </button>
    <button className={SIGN_OUT_BUTTON_CLASSES} onClick={account.onSignOut} type="button">
      Sign out
    </button>
  </div>
)
