import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const CHOICE_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type ResponseSheetTabChoiceProps = {
  spreadsheetName: string | undefined
  tabNames: readonly string[]
  onChoose: (sheetName: string) => void
  onCancel: () => void
}

/* A Google Form's responses spreadsheet usually holds one tab and sometimes
   holds several, and which one carries the responses is not something to
   guess: one of these events keeps its waiting list on a tab of its own. */
export const ResponseSheetTabChoice = ({
  spreadsheetName,
  tabNames,
  onChoose,
  onCancel,
}: ResponseSheetTabChoiceProps) => (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-ink">
      Which tab of {spreadsheetName ?? 'that spreadsheet'} holds the responses?
    </p>
    <ul className="flex flex-wrap gap-2">
      {tabNames.map((tabName) => (
        <li key={tabName}>
          <button className={CHOICE_BUTTON_CLASSES} onClick={() => onChoose(tabName)} type="button">
            {tabName}
          </button>
        </li>
      ))}
    </ul>
    <button className={`${CHOICE_BUTTON_CLASSES} self-start`} onClick={onCancel} type="button">
      Cancel
    </button>
  </div>
)
