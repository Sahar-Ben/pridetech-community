import type { DuplicateApplicant } from './duplicateApplicants'
import {
  describeDuplicateApplicant,
  describeDuplicateNames,
  describeSharedAddressNote,
} from './leadsReviewText'
import { SheetRowLink } from './SheetRowLink'

type DuplicateApplicantRowProps = {
  duplicate: DuplicateApplicant
  spreadsheetId: string
}

export const DuplicateApplicantRow = ({ duplicate, spreadsheetId }: DuplicateApplicantRowProps) => {
  const sharedAddressNote = describeSharedAddressNote({ duplicate })

  return (
    <li className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {describeDuplicateNames({ duplicate })}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {describeDuplicateApplicant({ duplicate })}
      </p>
      {sharedAddressNote !== undefined && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{sharedAddressNote}</p>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {duplicate.rowNumbers.map((rowNumber) => (
          <SheetRowLink key={rowNumber} rowNumber={rowNumber} spreadsheetId={spreadsheetId} />
        ))}
      </p>
    </li>
  )
}
