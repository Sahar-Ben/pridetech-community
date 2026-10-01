import type { AttachedSheetIssue } from './parseAttachedSheets'
import type { EventRowIssue } from './parseEventRegistry'

const describeEventIssue = (issue: EventRowIssue): string => {
  if (issue.kind === 'no-id') {
    return `Row ${issue.rowNumber}${issue.name === undefined ? '' : ` (${issue.name})`} has no Event ID, so it is not listed: attendance could never be attached to it. Delete the row, or add it again through this app.`
  }
  return `Row ${issue.rowNumber} has its date as "${issue.recordedDate}" rather than YYYY-MM-DD, so it may be listed as upcoming when it is past. Edit the event here to fix it.`
}

const describeSheetIssue = (issue: AttachedSheetIssue): string => {
  if (issue.kind === 'no-event-id') {
    return `Event sheets row ${issue.rowNumber} names no event, so it is ignored.`
  }
  if (issue.kind === 'no-sheet') {
    return `Event sheets row ${issue.rowNumber} names no spreadsheet or no tab, so it is ignored.`
  }
  if (issue.kind === 'unknown-role') {
    return `Event sheets row ${issue.rowNumber} has its role as "${issue.recordedRole}", which is neither main nor waiting list. It is being treated as a main sheet.`
  }
  return `Event sheets row ${issue.rowNumber} has a column mapping that could not be read. Attach the sheet again to replace it.`
}

const describeNoteCount = (count: number): string =>
  count === 1
    ? '1 row in the Events tabs needs a look'
    : `${count} rows in the Events tabs need a look`

type EventsDataQualityNotesProps = {
  eventIssues: readonly EventRowIssue[]
  attachedSheetIssues: readonly AttachedSheetIssue[]
}

/* Rows that were dropped or read with a caveat are handed to the organiser
   rather than dropped quietly. Every one of them names a row number, because
   the fix is in the spreadsheet and nothing else here will ever mention it. */
export const EventsDataQualityNotes = ({
  eventIssues,
  attachedSheetIssues,
}: EventsDataQualityNotesProps) => {
  const notes = [
    ...eventIssues.map(describeEventIssue),
    ...attachedSheetIssues.map(describeSheetIssue),
  ]

  if (notes.length === 0) {
    return undefined
  }

  return (
    <details className="rounded-[var(--radius-data)] border border-card-edge bg-card px-4 py-3 text-ink-muted">
      <summary className="cursor-pointer text-sm font-bold">{describeNoteCount(notes.length)}</summary>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </details>
  )
}
