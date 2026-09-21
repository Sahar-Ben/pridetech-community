const ACTION_CLASSES =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

type WorkspaceHeaderProps = {
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const WorkspaceHeader = ({ onChangeSpreadsheet, onSignOut }: WorkspaceHeaderProps) => (
  <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pt-4">
    <h1 className="text-2xl font-semibold">PrideTech Community</h1>
    <div className="flex items-center gap-2">
      <button className={ACTION_CLASSES} onClick={onChangeSpreadsheet} type="button">
        Change spreadsheet
      </button>
      <button className={ACTION_CLASSES} onClick={onSignOut} type="button">
        Sign out
      </button>
    </div>
  </div>
)
