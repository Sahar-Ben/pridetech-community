import { useId, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender } from './decision'
import type { Lead } from './lead'

const FIELD_SEPARATOR = ' \u{00b7} '

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
]

const joinPresentFields = (fields: ReadonlyArray<string | undefined>): string =>
  fields.filter((field) => field !== undefined).join(FIELD_SEPARATOR)

const isGender = (value: string): value is Gender =>
  GENDER_OPTIONS.some((option) => option.value === value)

type ApplicationCardProps = {
  lead: Lead
  onApprove: (decision: ApprovalDecision) => void
  onDecline: (decision: DeclineDecision) => void
}

export const ApplicationCard = ({ lead, onApprove, onDecline }: ApplicationCardProps) => {
  const genderSelectId = useId()
  const [gender, setGender] = useState<Gender>('unknown')

  const isNamedByEmail = lead.name === undefined
  const applicantName = lead.name ?? lead.email
  const roleLine = joinPresentFields([lead.jobTitle, lead.company])
  const contextLine = joinPresentFields([lead.city, lead.interests])
  const contactLine = joinPresentFields([isNamedByEmail ? undefined : lead.email, lead.phone])

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 space-y-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {applicantName}
        </h3>
        {roleLine !== '' && (
          <p className="text-sm text-slate-700 dark:text-slate-300">{roleLine}</p>
        )}
        {contextLine !== '' && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{contextLine}</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lead.linkedIn === undefined ? (
            <span className="font-medium text-amber-700 dark:text-amber-500">No LinkedIn</span>
          ) : (
            <a
              className="font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
              href={lead.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          )}
          {contactLine !== '' && (
            <span>
              {FIELD_SEPARATOR}
              {contactLine}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
          htmlFor={genderSelectId}
        >
          Gender
        </label>
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          type="button"
          onClick={() => onApprove({ lead, gender })}
        >
          Approve
        </button>
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          type="button"
          onClick={() => onDecline({ lead })}
        >
          Decline
        </button>
      </div>
    </li>
  )
}
