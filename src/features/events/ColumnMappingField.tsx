import { useId } from 'react'
import { buildColumnChoices, describeColumnChoice } from './columnChoices'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'

const NOT_ON_THIS_SHEET = 'Not on this sheet'

const NOT_ON_THIS_SHEET_VALUE = ''

type ColumnMappingFieldProps = {
  label: string
  headerRow: readonly string[]
  columnIndex: number | undefined
  onChange: (columnIndex: number | undefined) => void
}

/* Every column is offered, including the ones with no heading, and so is "not
   on this sheet": five of these forms never asked for an email, and a chooser
   with no way to say so would force the organiser to map the field to some
   other column just to get past the screen. */
export const ColumnMappingField = ({
  label,
  headerRow,
  columnIndex,
  onChange,
}: ColumnMappingFieldProps) => {
  const fieldId = useId()

  return (
    <label className="flex flex-col gap-1 py-2" htmlFor={fieldId}>
      <span className={FIELD_LABEL_CLASSES}>{label}</span>
      <select
        className={`${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`}
        id={fieldId}
        onChange={(event) => {
          const chosen = event.target.value
          onChange(chosen === NOT_ON_THIS_SHEET_VALUE ? undefined : Number(chosen))
        }}
        value={columnIndex === undefined ? NOT_ON_THIS_SHEET_VALUE : String(columnIndex)}
      >
        <option value={NOT_ON_THIS_SHEET_VALUE}>{NOT_ON_THIS_SHEET}</option>
        {buildColumnChoices({ headerRow }).map((choice) => (
          <option key={choice.columnIndex} value={String(choice.columnIndex)}>
            {describeColumnChoice(choice)}
          </option>
        ))}
      </select>
    </label>
  )
}
