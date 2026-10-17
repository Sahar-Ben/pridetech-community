import { useState } from 'react'
import type { DuplicateApplicant } from './duplicateApplicants'
import type { Lead, LeadStatus } from './lead'
import {
  describeDuplicateApplicant,
  describeDuplicateNames,
  describeSharedAddressNote,
} from './leadsReviewText'
import { SheetRowLink } from './SheetRowLink'
import { ConfirmDialog } from '../../app/ConfirmDialog'
import { useAsyncAction } from '../events/useAsyncAction'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const ROW_CLASSES = `${WORK_PANEL_CLASSES} flex flex-col gap-0.5 px-3 py-2`

const MARK_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} mt-2 min-h-11 self-start`

const MARK_FAILED_MESSAGE = 'The rows were not marked, and the Leads tab was not changed.'

const STATUS_WORDS: Readonly<Record<LeadStatus, string>> = {
  pending: 'not decided',
  approved: 'approved',
  declined: 'declined',
  maybe: 'kept for later',
  duplicate: 'duplicate',
}

const describeRow = (lead: Lead): string =>
  [
    `Row ${lead.rowNumber}`,
    ...(lead.timestamp === undefined ? [] : [`sent ${lead.timestamp}`]),
    STATUS_WORDS[lead.status],
  ].join(', ')

type DuplicateApplicantRowProps = {
  duplicate: DuplicateApplicant
  spreadsheetId: string
  onMarkDuplicates: (duplicate: DuplicateApplicant) => Promise<void>
}

/* Folding the group into one is a write to several rows, so it asks first and
   says exactly which row stays and which are marked: the reviewer is choosing
   which application is the person's real one, and on a shared inbox the
   answer may be that none of them is a duplicate at all. */
export const DuplicateApplicantRow = ({
  duplicate,
  spreadsheetId,
  onMarkDuplicates,
}: DuplicateApplicantRowProps) => {
  const sharedAddressNote = describeSharedAddressNote({ duplicate })
  const [isConfirming, setIsConfirming] = useState(false)
  const marking = useAsyncAction({ fallbackMessage: MARK_FAILED_MESSAGE })
  const laterCount = duplicate.laterLeads.length
  const rowsWord = laterCount === 1 ? 'row' : 'rows'

  const confirm = () => {
    marking.run(async () => {
      await onMarkDuplicates(duplicate)
      setIsConfirming(false)
    })
  }

  const cancel = () => {
    setIsConfirming(false)
    marking.forgetError()
  }

  return (
    <li className={ROW_CLASSES}>
      <p className="text-sm font-semibold wrap-anywhere text-ink">
        {describeDuplicateNames({ duplicate })}
      </p>
      <p className="text-xs wrap-anywhere text-ink-muted">{describeDuplicateApplicant({ duplicate })}</p>
      {sharedAddressNote !== undefined && (
        <p className="text-xs font-semibold text-warning-on-panel">{sharedAddressNote}</p>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {duplicate.rowNumbers.map((rowNumber) => (
          <SheetRowLink key={rowNumber} rowNumber={rowNumber} spreadsheetId={spreadsheetId} />
        ))}
      </p>
      <button
        aria-label={`Mark the later applications from ${duplicate.emailKey} as duplicates`}
        className={MARK_BUTTON_CLASSES}
        onClick={() => setIsConfirming(true)}
        type="button"
      >
        Mark as duplicate
      </button>

      {isConfirming && (
        <ConfirmDialog
          busyLabel="Marking\u{2026}"
          cancelLabel="Not now"
          confirmLabel={`Mark ${laterCount} ${rowsWord}`}
          errorMessage={marking.errorMessage}
          isBusy={marking.isRunning}
          onCancel={cancel}
          onConfirm={confirm}
          title={`Mark ${laterCount} ${rowsWord} as duplicate?`}
        >
          <p>
            <span className="font-semibold">Keeps</span> {describeRow(duplicate.keptLead)}.
          </p>
          <p>
            <span className="font-semibold">Marks Duplicate</span>{' '}
            {duplicate.laterLeads.map(describeRow).join('; ')}.
          </p>
          <p className="text-ink-muted">
            Their Status becomes Duplicate, so they leave the review queue. Nothing is deleted: the
            rows stay on the Leads tab.
          </p>
          {sharedAddressNote !== undefined && (
            <p className="font-semibold text-warning-on-panel">{sharedAddressNote}</p>
          )}
        </ConfirmDialog>
      )}
    </li>
  )
}
