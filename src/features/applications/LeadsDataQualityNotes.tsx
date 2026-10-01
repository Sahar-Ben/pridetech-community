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

/* Prose about the sheet rather than a row of it: the warnings are banners,
   and the one line explaining where to fix them is the quiet footnote. */
const NOTES_CLASSES = 'flex flex-col gap-2.5 text-sm text-ink-muted'

const FOOTNOTE_CLASSES = 'flex items-start gap-2 text-xs text-ink-faint'

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
    <div className={NOTES_CLASSES}>

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

      {hasRowsToOpen && (
        <p className={FOOTNOTE_CLASSES}>
          <svg
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
          </svg>
          <span>
            Fixing any of these means editing the Leads tab in Google Sheets: this app writes a
            decision into the Status column and nothing else, so reload once you have.
          </span>
        </p>
      )}
    </div>
  )
}
