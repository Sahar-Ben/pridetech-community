import { DuplicateApplicantRow } from './DuplicateApplicantRow'
import type { LeadsReview } from './leadsReview'
import {
  describeLeadsWithoutEmailNote,
  describeMembersWithoutEmailNote,
  describeRepeatedEmailsNote,
} from './leadsReviewText'
import { LeadWithoutEmailRow } from './LeadWithoutEmailRow'
import { SheetIssueDisclosure } from './SheetIssueDisclosure'

type LeadsDataQualityNotesProps = {
  review: LeadsReview
  spreadsheetId: string
}

const ROW_LIST_CLASSES = 'flex flex-col gap-1.5'

/* These three facts live nowhere else: the Members tab shows who was approved,
   but nothing in the app or the sheet shows which rows the reviewer can never
   match and which addresses were entered twice. They render whether or not the
   filter excluded anybody, because a clean filter does not mean a clean sheet. */
export const LeadsDataQualityNotes = ({ review, spreadsheetId }: LeadsDataQualityNotesProps) => {
  const { counts, leadsWithoutEmail, duplicateApplicants } = review
  const leadsWithoutEmailNote = describeLeadsWithoutEmailNote({
    count: counts.leadsWithoutEmailCount,
  })
  const membersWithoutEmailNote = describeMembersWithoutEmailNote({
    count: counts.membersWithoutEmailCount,
  })
  const repeatedEmailsNote = describeRepeatedEmailsNote({ count: counts.repeatedLeadEmailCount })
  const hasRowsToOpen = leadsWithoutEmailNote !== undefined || repeatedEmailsNote !== undefined

  if (!hasRowsToOpen && membersWithoutEmailNote === undefined) {
    return undefined
  }

  return (
    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
      {hasRowsToOpen && (
        <p>
          Fixing any of these means editing the Leads tab in Google Sheets: this app writes a
          decision into the Status column and nothing else, so reload once you have.
        </p>
      )}

      {leadsWithoutEmailNote !== undefined && (
        <SheetIssueDisclosure summary={leadsWithoutEmailNote}>
          <ul className={ROW_LIST_CLASSES}>
            {leadsWithoutEmail.map((leadWithoutEmail) => (
              <LeadWithoutEmailRow
                key={leadWithoutEmail.rowNumber}
                leadWithoutEmail={leadWithoutEmail}
                spreadsheetId={spreadsheetId}
              />
            ))}
          </ul>
        </SheetIssueDisclosure>
      )}

      {membersWithoutEmailNote !== undefined && <p>{membersWithoutEmailNote}</p>}

      {repeatedEmailsNote !== undefined && (
        <SheetIssueDisclosure summary={repeatedEmailsNote}>
          <ul className={ROW_LIST_CLASSES}>
            {duplicateApplicants.map((duplicate) => (
              <DuplicateApplicantRow
                key={duplicate.emailKey}
                duplicate={duplicate}
                spreadsheetId={spreadsheetId}
              />
            ))}
          </ul>
        </SheetIssueDisclosure>
      )}

    </div>
  )
}
