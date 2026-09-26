import type { AttachedResponseSheet } from './parseAttachedSheets'
import { hasMappedEmail } from './responseSheetMapping'

const ROLE_LABELS = { main: 'Main response sheet', 'waiting list': 'Waiting list' } as const

type AttachedSheetRowProps = {
  sheet: AttachedResponseSheet
}

const describeMapping = (sheet: AttachedResponseSheet): string => {
  if (sheet.mapping === undefined) {
    return 'The column mapping on this row could not be read. Attach the sheet again to replace it.'
  }
  if (!hasMappedEmail(sheet.mapping)) {
    return 'No email column: these people will have to be matched to members by name.'
  }
  return 'Columns mapped, including an email column.'
}

export const AttachedSheetRow = ({ sheet }: AttachedSheetRowProps) => (
  <li className="rounded-xl border border-hairline px-3 py-2">
    <p className="text-sm font-bold text-ink">{sheet.sheetName}</p>
    <p className="text-xs text-ink-muted">{ROLE_LABELS[sheet.role]}</p>
    <p className="text-xs text-ink-muted">{describeMapping(sheet)}</p>
  </li>
)
