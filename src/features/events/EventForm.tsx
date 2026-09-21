import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormCheckboxField } from './FormCheckboxField'
import { FormTextField } from './FormTextField'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import {
  hasEventDraftErrors,
  validateEventDraft,
  type EventDraft,
  type EventDraftErrors,
} from './eventDraft'
import { DATA_PANEL_CLASSES } from '../../theme/surfaces'

const SAVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const CANCEL_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const FORM_CLASSES = `${DATA_PANEL_CLASSES} animate-rise flex flex-col gap-4 px-4 py-4 sm:px-6`

type EventFormProps = {
  title: string
  initialDraft: EventDraft
  onSave: (draft: EventDraft) => void
  onCancel: () => void
}

export const EventForm = ({ title, initialDraft, onSave, onCancel }: EventFormProps) => {
  const [draft, setDraft] = useState<EventDraft>(initialDraft)
  const [errors, setErrors] = useState<EventDraftErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const updateDraft = (change: Partial<EventDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...change }))
  }

  const submitEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const foundErrors = validateEventDraft(draft)
    setErrors(foundErrors)
    if (hasEventDraftErrors(foundErrors)) {
      return
    }
    onSave(draft)
  }

  return (
    <form
      className={FORM_CLASSES}
      noValidate
      onSubmit={submitEvent}
    >
      <h3 className="text-2xl font-bold tracking-tight text-ink">{title}</h3>

      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <FormTextField
          errorMessage={errors.name}
          inputRef={nameInputRef}
          label="Name"
          onChange={(name) => updateDraft({ name })}
          value={draft.name}
        />
        <FormTextField
          errorMessage={errors.date}
          inputType="date"
          label="Date"
          onChange={(date) => updateDraft({ date })}
          value={draft.date}
        />
        <FormTextField
          errorMessage={errors.location}
          label="Location"
          onChange={(location) => updateDraft({ location })}
          value={draft.location}
        />
        <FormTextField
          label="Host company (optional)"
          onChange={(host) => updateDraft({ host })}
          value={draft.host}
        />
      </div>

      <FormCheckboxField
        hint="Most events are. The check-in screen warns before admitting somebody who is not in the member list, and never refuses them."
        isChecked={draft.isMembersOnly}
        label="Members only"
        onChange={(isMembersOnly) => updateDraft({ isMembersOnly })}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button className={SAVE_BUTTON_CLASSES} type="submit">
          Save event
        </button>
        <button className={CANCEL_BUTTON_CLASSES} onClick={onCancel} type="button">
          Cancel
        </button>
        <p className="text-xs font-semibold text-warning-ink">
          Saving keeps the event in this browser only. Nothing here reaches the Google Sheet yet.
        </p>
      </div>
    </form>
  )
}
