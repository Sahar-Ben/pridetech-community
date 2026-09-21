import { useId } from 'react'

const CHECKBOX_CLASSES = 'size-5 shrink-0 accent-indigo-600'

const HINT_CLASSES = 'text-xs text-slate-500 dark:text-slate-400'

type FormCheckboxFieldProps = {
  label: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
  hint?: string
}

export const FormCheckboxField = ({ label, isChecked, onChange, hint }: FormCheckboxFieldProps) => {
  const inputId = useId()
  const hintId = useId()

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-2">
        <input
          aria-describedby={hint === undefined ? undefined : hintId}
          checked={isChecked}
          className={CHECKBOX_CLASSES}
          id={inputId}
          onChange={(changeEvent) => onChange(changeEvent.target.checked)}
          type="checkbox"
        />
        <label className="text-sm text-slate-900 dark:text-slate-100" htmlFor={inputId}>
          {label}
        </label>
      </div>
      {hint !== undefined && (
        <p className={HINT_CLASSES} id={hintId}>
          {hint}
        </p>
      )}
    </div>
  )
}
