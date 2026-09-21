import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormTextField } from './FormTextField'
import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../../theme/controls'
import { hasWalkInErrors, validateWalkInDraft, type WalkInErrors } from './walkInValidation'
import type { WalkInFields } from './walkInValidation'

const EMPTY_WALK_IN = { name: '', email: '' }

const SAVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

type WalkInFormProps = {
  onAdd: (walkIn: WalkInFields) => void
}

export const WalkInForm = ({ onAdd }: WalkInFormProps) => {
  const [fields, setFields] = useState(EMPTY_WALK_IN)
  const [errors, setErrors] = useState<WalkInErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const submitWalkIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const foundErrors = validateWalkInDraft(fields)
    setErrors(foundErrors)
    if (hasWalkInErrors(foundErrors)) {
      return
    }
    onAdd(fields)
  }

  return (
    <form className="flex flex-col gap-2" noValidate onSubmit={submitWalkIn}>
      <FormTextField
        errorMessage={errors.name}
        inputRef={nameInputRef}
        label="Name"
        onChange={(name) => setFields((current) => ({ ...current, name }))}
        value={fields.name}
      />
      <FormTextField
        errorMessage={errors.email}
        inputType="email"
        label="Email (optional)"
        onChange={(email) => setFields((current) => ({ ...current, email }))}
        value={fields.email}
      />
      <button className={`self-start ${SAVE_BUTTON_CLASSES}`} type="submit">
        Add walk-in
      </button>
    </form>
  )
}
