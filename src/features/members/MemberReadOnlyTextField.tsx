import { useId } from 'react'
import { FIELD_LABEL_CLASSES, READ_ONLY_FIELD_CONTROL_CLASSES } from './memberFieldStyles'

type MemberReadOnlyTextFieldProps = {
  label: string
  value: string | undefined
  explanation: string
}

export const MemberReadOnlyTextField = ({
  label,
  value,
  explanation,
}: MemberReadOnlyTextFieldProps) => {
  const inputId = useId()
  const explanationId = useId()

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <label className={FIELD_LABEL_CLASSES} htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={explanationId}
        className={READ_ONLY_FIELD_CONTROL_CLASSES}
        id={inputId}
        readOnly
        type="text"
        value={value ?? ''}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400" id={explanationId}>
        {explanation}
      </p>
    </div>
  )
}
