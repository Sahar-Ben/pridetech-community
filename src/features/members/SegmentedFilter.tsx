import { useId } from 'react'
import { FIELD_LABEL_CLASSES } from '../../theme/fields'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

/* One card of equal cells, the chosen one filled: a filter reads as a single
   question with a few answers, where a wrap of loose pills read as a pile of
   tags. Same shape as the status control on Applications. */
const BAR_CLASSES = `${WORK_PANEL_CLASSES} grid gap-1 rounded-[18px] p-1`

const CELL_CLASSES = [
  'flex min-h-11 min-w-0 flex-col items-center justify-center rounded-[14px] border px-1 py-1',
  'text-sm leading-tight transition-colors duration-150 ease-brand',
].join(' ')

const SELECTED_CELL_CLASSES = 'border-accent-solid bg-accent-solid font-bold text-on-accent'

const UNSELECTED_CELL_CLASSES = 'border-transparent text-neutral-ink hover:bg-surface'

const COUNT_CLASSES = 'font-mono text-[11px] font-medium'

export type SegmentedOption<Value extends string> = {
  value: Value
  /* What the cell shows: kept short so five of them fit across a phone. */
  label: string
  /* What a screen reader hears, where the short label alone would be a bare
     number. */
  spokenLabel?: string
  count?: number
}

type SegmentedFilterProps<Value extends string> = {
  label: string
  options: readonly SegmentedOption<Value>[]
  selected: Value
  onSelect: (value: Value) => void
}

export const SegmentedFilter = <Value extends string>({
  label,
  options,
  selected,
  onSelect,
}: SegmentedFilterProps<Value>) => {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL_CLASSES} id={labelId}>
        {label}
      </span>
      <div
        aria-labelledby={labelId}
        className={BAR_CLASSES}
        role="group"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isSelected = option.value === selected
          const spoken = option.spokenLabel ?? option.label
          return (
            <button
              aria-label={option.count === undefined ? spoken : `${spoken} ${option.count}`}
              aria-pressed={isSelected}
              className={`${CELL_CLASSES} ${isSelected ? SELECTED_CELL_CLASSES : UNSELECTED_CELL_CLASSES}`}
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
            >
              <span className="max-w-full text-center wrap-break-word">{option.label}</span>
              {option.count !== undefined && (
                <span
                  className={`${COUNT_CLASSES} ${isSelected ? 'text-on-accent' : 'text-ink-faint'}`}
                >
                  {option.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
