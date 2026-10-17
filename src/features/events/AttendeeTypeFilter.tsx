import type { AttendeeTypeFilter as Filter, AttendeeTypeSummary } from './attendeeTypes'

const CHIP_BASE_CLASSES =
  'inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-4 text-left text-sm transition-colors duration-150 ease-brand'

const chipClasses = (isSelected: boolean): string =>
  [
    CHIP_BASE_CLASSES,
    isSelected
      ? 'bg-accent-solid font-bold text-on-accent'
      : 'border border-card-strong-edge bg-card text-neutral-ink hover:bg-surface',
  ].join(' ')

const isSameFilter = (first: Filter, second: Filter): boolean =>
  first.kind === second.kind &&
  (first.kind !== 'type' || (second.kind === 'type' && first.key === second.key))

type Chip = { filter: Filter; label: string; count: number }

type AttendeeTypeFilterProps = {
  summary: AttendeeTypeSummary
  totalCount: number
  filter: Filter
  onFilterChange: (filter: Filter) => void
}

/* The answers are the form's own, so the chips are built from what people
   wrote rather than from a list this app keeps. "No answer" is a chip of its
   own whenever anybody gave none, so the chips always add up to "All". */
export const AttendeeTypeFilter = ({
  summary,
  totalCount,
  filter,
  onFilterChange,
}: AttendeeTypeFilterProps) => {
  const chips: readonly Chip[] = [
    { filter: { kind: 'all' }, label: 'All', count: totalCount },
    ...summary.types.map((type) => ({
      filter: { kind: 'type', key: type.key } as const,
      label: type.label,
      count: type.count,
    })),
    ...(summary.unansweredCount > 0
      ? [{ filter: { kind: 'unanswered' } as const, label: 'No answer', count: summary.unansweredCount }]
      : []),
  ]

  return (
    <div aria-label="Attendee type" className="flex flex-wrap gap-2" role="group">
      {chips.map((chip) => {
        const isSelected = isSameFilter(chip.filter, filter)
        return (
          <button
            aria-pressed={isSelected}
            className={chipClasses(isSelected)}
            key={chip.filter.kind === 'type' ? `type-${chip.filter.key}` : chip.filter.kind}
            onClick={() => onFilterChange(chip.filter)}
            type="button"
          >
            {/* The space before the count keeps a screen reader from running
                the two together. */}
            <span className="min-w-0 wrap-anywhere">{chip.label}</span>{' '}
            <span className="font-mono text-xs">{chip.count}</span>
          </button>
        )
      })}
    </div>
  )
}
