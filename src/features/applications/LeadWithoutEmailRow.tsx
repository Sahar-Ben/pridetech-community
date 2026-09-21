import { describeLeadWithoutEmail } from './leadsReviewText'
import type { LeadWithoutEmail } from './parseLeads'
import { SheetRowLink } from './SheetRowLink'

type LeadWithoutEmailRowProps = {
  leadWithoutEmail: LeadWithoutEmail
  spreadsheetId: string
}

export const LeadWithoutEmailRow = ({
  leadWithoutEmail,
  spreadsheetId,
}: LeadWithoutEmailRowProps) => (
  <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
      {describeLeadWithoutEmail({ leadWithoutEmail })}
    </span>
    <SheetRowLink rowNumber={leadWithoutEmail.rowNumber} spreadsheetId={spreadsheetId} />
  </li>
)
