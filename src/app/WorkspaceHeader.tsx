import { COMPACT_BUTTON_SIZE_CLASSES, SHELL_BUTTON_CLASSES } from '../theme/controls'

const ACTION_CLASSES = `${SHELL_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type WorkspaceHeaderProps = {
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const WorkspaceHeader = ({ onChangeSpreadsheet, onSignOut }: WorkspaceHeaderProps) => (
  <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 pt-6 pb-2">
    <div className="flex items-stretch gap-3">
      <span aria-hidden="true" className="rainbow-mark" />
      <h1 className="font-display text-3xl leading-none font-light tracking-tight text-on-brand sm:text-4xl">
        PrideTech Community
      </h1>
    </div>
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
