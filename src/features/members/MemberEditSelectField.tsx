import { useId } from 'react'
import {
  FIELD_BORDER_CLASSES,
  FIELD_CONTROL_CLASSES,
  FIELD_LABEL_CLASSES,
} from '../../theme/fields'
import type { SelectOption } from './memberEditOptions'

type MemberEditSelectFieldProps<TValue extends string> = {
  label: string
  value: TValue
  options: ReadonlyArray<SelectOption<TValue>>
  onChange: (value: TValue) => void
}

export const MemberEditSelectField = <TValue extends string>({
  label,
  value,
  options,
  onChange,
}: MemberEditSelectFieldProps<TValue>) => {
  const selectId = useId()

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <label className={FIELD_LABEL_CLASSES} htmlFor={selectId}>
        {label}
      </label>
      <select
        className={`${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`}
        id={selectId}
        onChange={(event) => {
          const chosenOption = options.find((option) => option.value === event.target.value)
          if (chosenOption !== undefined) {
            onChange(chosenOption.value)
          }
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
