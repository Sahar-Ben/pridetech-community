import { useId, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender } from './decision'
import type { Lead } from './lead'

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
]

const isGender = (value: string): value is Gender =>
  GENDER_OPTIONS.some((option) => option.value === value)

type ApplicationDecisionControlsProps = {
  lead: Lead
  isSaving: boolean
  onApprove: (decision: ApprovalDecision) => void
  onDecline: (decision: DeclineDecision) => void
}

export const ApplicationDecisionControls = ({
  lead,
  isSaving,
  onApprove,
  onDecline,
}: ApplicationDecisionControlsProps) => {
  const genderSelectId = useId()
  const [gender, setGender] = useState<Gender>('unknown')

  return (
    <div className="flex shrink-0 items-center gap-2">
      <label
        className="text-xs font-medium text-slate-500 dark:text-slate-400"
        htmlFor={genderSelectId}
      >
        Gender
      </label>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        disabled={isSaving}
        id={genderSelectId}
        value={gender}
        onChange={(event) => {
          const selected = event.target.value
          if (isGender(selected)) {
            setGender(selected)
          }
        }}
      >
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving}
        type="button"
        onClick={() => onApprove({ lead, gender })}
      >
        {isSaving ? 'Saving...' : 'Approve'}
      </button>
      <button
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        disabled={isSaving}
        type="button"
        onClick={() => onDecline({ lead })}
      >
        Decline
      </button>
    </div>
  )
}
