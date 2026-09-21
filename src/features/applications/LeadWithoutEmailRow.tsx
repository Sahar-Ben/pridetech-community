import { describeLeadWithoutEmail } from './leadsReviewText'
import type { LeadWithoutEmail } from './parseLeads'
import { SheetRowLink } from './SheetRowLink'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const ROW_CLASSES = `${WORK_PANEL_CLASSES} flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 text-xs`

type LeadWithoutEmailRowProps = {
  leadWithoutEmail: LeadWithoutEmail
  spreadsheetId: string
}

export const LeadWithoutEmailRow = ({
  leadWithoutEmail,
  spreadsheetId,
}: LeadWithoutEmailRowProps) => (
  <li className={ROW_CLASSES}>
    <span className="text-sm font-semibold text-ink">
      {describeLeadWithoutEmail({ leadWithoutEmail })}
    </span>
    <SheetRowLink rowNumber={leadWithoutEmail.rowNumber} spreadsheetId={spreadsheetId} />
  </li>
)
