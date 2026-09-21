import { useId, type RefObject } from 'react'
import {
  FIELD_BORDER_CLASSES,
  FIELD_CONTROL_CLASSES,
  FIELD_ERROR_CLASSES,
  FIELD_LABEL_CLASSES,
  INVALID_FIELD_BORDER_CLASSES,
} from './memberFieldStyles'

type MemberEditTextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  errorMessage?: string
  inputRef?: RefObject<HTMLInputElement | null>
}

export const MemberEditTextField = ({
  label,
  value,
  onChange,
  errorMessage,
  inputRef,
}: MemberEditTextFieldProps) => {
  const inputId = useId()
  const errorId = useId()
  const isInvalid = errorMessage !== undefined

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <label className={FIELD_LABEL_CLASSES} htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={isInvalid ? errorId : undefined}
        aria-invalid={isInvalid || undefined}
        className={`${FIELD_CONTROL_CLASSES} ${isInvalid ? INVALID_FIELD_BORDER_CLASSES : FIELD_BORDER_CLASSES}`}
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        ref={inputRef}
        type="text"
        value={value}
      />
      {isInvalid && (
        <p className={FIELD_ERROR_CLASSES} id={errorId} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
