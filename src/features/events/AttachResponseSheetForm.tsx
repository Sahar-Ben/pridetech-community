import { useState, type FormEvent } from 'react'
import { ColumnMappingField } from './ColumnMappingField'
import { RESPONSE_SHEET_ROLES, type ResponseSheetRole } from './eventRegistryTabs'
import {
  guessResponseSheetMapping,
  hasMappedEmail,
  MAPPED_FIELDS,
  type MappedField,
  type ResponseSheetMapping,
} from './responseSheetMapping'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'

const FIELD_LABELS: Readonly<Record<MappedField, string>> = {
  timestamp: 'Timestamp column',
  name: 'Name column',
  email: 'Email column',
  company: 'Company column',
  jobTitle: 'Job title column',
  attendeeType: 'Attendee type column',
}

const ROLE_LABELS: Readonly<Record<ResponseSheetRole, string>> = {
  main: 'Main response sheet',
  'waiting list': 'Waiting list',
}

const SAVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const CANCEL_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type AttachResponseSheetFormProps = {
  sheetName: string
  spreadsheetName: string | undefined
  headerRow: readonly string[]
  /* What is already recorded for a sheet whose columns are being changed, in
     place of a guess: the organiser came to change one answer, not all five. */
  recorded: { role: ResponseSheetRole; mapping: ResponseSheetMapping | undefined } | undefined
  isSaving: boolean
  onSave: (options: { role: ResponseSheetRole; mapping: ResponseSheetMapping }) => void
  onCancel: () => void
}

/* The guess is shown, never applied behind the organiser's back. No two of
   these 22 response sheets have the same header row, one of them has a blank
   cell over its timestamp column and another repeats a heading, so a guess is
   worth offering and never worth trusting. What they confirm here is what
   every organiser after them inherits. */
export const AttachResponseSheetForm = ({
  sheetName,
  spreadsheetName,
  headerRow,
  recorded,
  isSaving,
  onSave,
  onCancel,
}: AttachResponseSheetFormProps) => {
  const isChanging = recorded !== undefined
  const [role, setRole] = useState<ResponseSheetRole>(recorded?.role ?? 'main')
  const [mapping, setMapping] = useState<ResponseSheetMapping>(
    () => recorded?.mapping ?? guessResponseSheetMapping({ headerRow }),
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave({ role, mapping })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <p className="text-sm text-ink">
        {sheetName}
        {spreadsheetName === undefined ? '' : ` in ${spreadsheetName}`}
      </p>

      <label className="flex flex-col gap-1">
        <span className={FIELD_LABEL_CLASSES}>What this sheet is</span>
        <select
          className={`${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`}
          onChange={(event) => setRole(event.target.value === 'waiting list' ? 'waiting list' : 'main')}
          value={role}
        >
          {RESPONSE_SHEET_ROLES.map((sheetRole) => (
            <option key={sheetRole} value={sheetRole}>
              {ROLE_LABELS[sheetRole]}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-ink-muted">
        {isChanging
          ? 'These are the columns recorded for this sheet. Change any of them, and every organiser reading this event afterwards will use the new ones.'
          : 'Check each column below. This is a guess from the headings, and it is what every organiser reading this event afterwards will use.'}
      </p>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {MAPPED_FIELDS.map((field) => (
          <ColumnMappingField
            columnIndex={mapping[field]}
            headerRow={headerRow}
            key={field}
            label={FIELD_LABELS[field]}
            onChange={(columnIndex) =>
              setMapping((current) => ({ ...current, [field]: columnIndex }))
            }
          />
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        Attendee type is for a form that asks people which kind of guest they are, such as
        looking for a job or recruiting. The registrant list can then be filtered by each
        answer.
      </p>

      {!hasMappedEmail(mapping) && (
        <p className="text-xs font-semibold text-warning-ink">
          This sheet has no email column. That is recorded as a fact about the sheet, and the
          people on it will have to be matched to members by name instead.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className={SAVE_BUTTON_CLASSES} disabled={isSaving} type="submit">
          {isSaving
            ? isChanging
              ? 'Saving\u{2026}'
              : 'Attaching\u{2026}'
            : isChanging
              ? 'Save columns'
              : 'Attach this sheet'}
        </button>
        <button className={CANCEL_BUTTON_CLASSES} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  )
}
