import type { DuplicateApplicant } from './duplicateApplicants'
import {
  describeDuplicateApplicant,
  describeDuplicateNames,
  describeSharedAddressNote,
} from './leadsReviewText'
import { SheetRowLink } from './SheetRowLink'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const ROW_CLASSES = `${WORK_PANEL_CLASSES} flex flex-col gap-0.5 px-3 py-2`

type DuplicateApplicantRowProps = {
  duplicate: DuplicateApplicant
  spreadsheetId: string
}

export const DuplicateApplicantRow = ({ duplicate, spreadsheetId }: DuplicateApplicantRowProps) => {
  const sharedAddressNote = describeSharedAddressNote({ duplicate })

  return (
    <li className={ROW_CLASSES}>
      <p className="text-sm font-semibold text-ink">{describeDuplicateNames({ duplicate })}</p>
      <p className="text-xs text-ink-muted">{describeDuplicateApplicant({ duplicate })}</p>
      {sharedAddressNote !== undefined && (
        <p className="text-xs font-semibold text-warning-on-panel">{sharedAddressNote}</p>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {duplicate.rowNumbers.map((rowNumber) => (
          <SheetRowLink key={rowNumber} rowNumber={rowNumber} spreadsheetId={spreadsheetId} />
        ))}
      </p>
    </li>
  )
}
