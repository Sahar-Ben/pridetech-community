import type { AttachedResponseSheet } from './parseAttachedSheets'
import { hasMappedEmail } from './responseSheetMapping'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const CHANGE_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} min-h-11 shrink-0`

const ROLE_LABELS = { main: 'Main response sheet', 'waiting list': 'Waiting list' } as const

type AttachedSheetRowProps = {
  sheet: AttachedResponseSheet
  isBusy: boolean
  onChangeColumns: () => void
}

const describeMapping = (sheet: AttachedResponseSheet): string => {
  if (sheet.mapping === undefined) {
    return 'The column mapping on this row could not be read. Attach the sheet again to replace it.'
  }
  if (!hasMappedEmail(sheet.mapping)) {
    return 'No email column: these people will have to be matched to members by name.'
  }
  if (sheet.mapping.attendeeType !== undefined) {
    return 'Columns mapped, including an email column and an attendee type column.'
  }
  return 'Columns mapped, including an email column.'
}

export const AttachedSheetRow = ({ sheet, isBusy, onChangeColumns }: AttachedSheetRowProps) => (
  <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline px-3 py-2">
    <div className="min-w-0">
      <p className="text-sm font-bold wrap-anywhere text-ink">{sheet.sheetName}</p>
      <p className="text-xs text-ink-muted">{ROLE_LABELS[sheet.role]}</p>
      <p className="text-xs text-ink-muted">{describeMapping(sheet)}</p>
    </div>
    <button
      aria-label={`Change columns for ${sheet.sheetName}`}
      className={CHANGE_BUTTON_CLASSES}
      disabled={isBusy}
      onClick={onChangeColumns}
      type="button"
    >
      Change columns
    </button>
  </li>
)
