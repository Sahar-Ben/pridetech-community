import { useId, useState } from 'react'
import { selectLeadsToMark, type DuplicateApplicant } from './duplicateApplicants'
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

const CHOICE_CLASSES =
  'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-hairline px-3 py-2 has-[:checked]:border-accent-solid'

const MARK_FAILED_MESSAGE = 'The rows were not marked, and the Leads tab was not changed.'

const STATUS_WORDS: Readonly<Record<LeadStatus, string>> = {
  pending: 'Not decided',
  approved: 'Approved',
  declined: 'Declined',
  maybe: 'Maybe',
  duplicate: 'Duplicate',
}

/* The decisions a reviewer took, which marking the row would replace. */
const DECIDED_STATUSES: ReadonlySet<LeadStatus> = new Set(['approved', 'declined', 'maybe'])

const describeRow = (lead: Lead): string =>
  [
    `Row ${lead.rowNumber}`,
    ...(lead.timestamp === undefined ? [] : [`sent ${lead.timestamp}`]),
    STATUS_WORDS[lead.status],
  ].join(' \u{00b7} ')

const pluralRows = (count: number): string => (count === 1 ? 'row' : 'rows')

/* What marking would cost, said before it happens: a decision replaced on a
   row, or a newer application left unread because an older answer was kept. */
const describeWarnings = ({
  kept,
  toMark,
}: {
  kept: Lead
  toMark: readonly Lead[]
}): readonly string[] => [
  ...toMark
    .filter((lead) => DECIDED_STATUSES.has(lead.status))
    .map(
      (lead) =>
        `Row ${lead.rowNumber} is ${STATUS_WORDS[lead.status]}. That status is replaced by Duplicate; its Reason cell is kept.`,
    ),
  ...(DECIDED_STATUSES.has(kept.status) &&
  kept.status !== 'approved' &&
  toMark.some((lead) => lead.status === 'pending' && lead.rowNumber > kept.rowNumber)
    ? [
        `The row kept is ${STATUS_WORDS[kept.status]}, so the newer application will not be reviewed. Keep the newer row instead to review it.`,
      ]
    : []),
]

type DuplicateApplicantRowProps = {
  duplicate: DuplicateApplicant
  spreadsheetId: string
  onMarkDuplicates: (options: { duplicate: DuplicateApplicant; keptRowNumber: number }) => Promise<void>
}

/* Folding the group into one is a write to several rows, so it asks first, and
   the reviewer chooses which application is the person's real one: a later
   row can be a slip of the form or somebody asking again, and on a shared
   inbox none of them may be a duplicate at all. A suggestion is chosen to
   start with, and what each choice would overwrite is said before anything
   is written. */
export const DuplicateApplicantRow = ({
  duplicate,
  spreadsheetId,
  onMarkDuplicates,
}: DuplicateApplicantRowProps) => {
  const choiceName = useId()
  const sharedAddressNote = describeSharedAddressNote({ duplicate })
  const [isConfirming, setIsConfirming] = useState(false)
  const [keptRowNumber, setKeptRowNumber] = useState(duplicate.suggestedKeptLead.rowNumber)
  const marking = useAsyncAction({ fallbackMessage: MARK_FAILED_MESSAGE })

  const keptLead =
    duplicate.leads.find((lead) => lead.rowNumber === keptRowNumber) ?? duplicate.suggestedKeptLead
  const toMark = selectLeadsToMark({ duplicate, keptRowNumber: keptLead.rowNumber })
  const warnings = describeWarnings({ kept: keptLead, toMark })

  const open = () => {
    setKeptRowNumber(duplicate.suggestedKeptLead.rowNumber)
    setIsConfirming(true)
  }

  const confirm = () => {
    marking.run(async () => {
      await onMarkDuplicates({ duplicate, keptRowNumber: keptLead.rowNumber })
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
        aria-label={`Mark the repeat applications from ${duplicate.emailKey} as duplicates`}
        className={MARK_BUTTON_CLASSES}
        onClick={open}
        type="button"
      >
        Mark as duplicate
      </button>

      {isConfirming && (
        <ConfirmDialog
          busyLabel="Marking\u{2026}"
          cancelLabel="Not now"
          confirmLabel={`Mark ${toMark.length} ${pluralRows(toMark.length)}`}
          errorMessage={marking.errorMessage}
          isBusy={marking.isRunning}
          onCancel={cancel}
          onConfirm={confirm}
          title="Which application do you keep?"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Application to keep</legend>
            {duplicate.leads.map((lead) => (
              <label className={CHOICE_CLASSES} key={lead.rowNumber}>
                <input
                  checked={lead.rowNumber === keptLead.rowNumber}
                  className="mt-1 size-4 shrink-0 accent-[var(--color-accent-solid)]"
                  disabled={marking.isRunning}
                  name={choiceName}
                  onChange={() => setKeptRowNumber(lead.rowNumber)}
                  type="radio"
                  value={lead.rowNumber}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="wrap-anywhere">{describeRow(lead)}</span>
                  {lead.rowNumber === duplicate.suggestedKeptLead.rowNumber && (
                    <span className="text-xs font-semibold text-ink-muted">Suggested</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>

          <p>
            <span className="font-semibold">Marked Duplicate:</span>{' '}
            {toMark.map((lead) => `row ${lead.rowNumber}`).join(', ')}.{' '}
            {toMark.length === 1 ? 'It leaves' : 'They leave'} the review lists; nothing is deleted
            from the Leads tab.
          </p>

          {warnings.map((warning) => (
            <p className="font-semibold text-warning-on-panel" key={warning}>
              {warning}
            </p>
          ))}
          {sharedAddressNote !== undefined && (
            <p className="font-semibold text-warning-on-panel">{sharedAddressNote}</p>
          )}
        </ConfirmDialog>
      )}
    </li>
  )
}
