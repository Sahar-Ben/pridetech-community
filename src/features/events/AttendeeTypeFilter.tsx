import type {
  AttendeeTypeArrivals,
  AttendeeTypeFilter as Filter,
  AttendeeTypeSummary,
} from './attendeeTypes'

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

type Chip = { filter: Filter; label: string; count: number; arrivedCount: number | undefined }

type AttendeeTypeFilterProps = {
  summary: AttendeeTypeSummary
  totalCount: number
  filter: Filter
  onFilterChange: (filter: Filter) => void
  /* At the door each chip says how many of its people have arrived, as
     "arrived/registered". */
  arrivals?: AttendeeTypeArrivals
}

/* The answers are the form's own, so the chips are built from what people
   wrote rather than from a list this app keeps. "No answer" is a chip of its
   own whenever anybody gave none, so the chips always add up to "All". */
export const AttendeeTypeFilter = ({
  summary,
  totalCount,
  filter,
  onFilterChange,
  arrivals,
}: AttendeeTypeFilterProps) => {
  const chips: readonly Chip[] = [
    { filter: { kind: 'all' }, label: 'All', count: totalCount, arrivedCount: arrivals?.totalCount },
    ...summary.types.map((type) => ({
      filter: { kind: 'type', key: type.key } as const,
      label: type.label,
      count: type.count,
      arrivedCount: arrivals === undefined ? undefined : (arrivals.byKey.get(type.key) ?? 0),
    })),
    ...(summary.unansweredCount > 0
      ? [
          {
            filter: { kind: 'unanswered' } as const,
            label: 'No answer',
            count: summary.unansweredCount,
            arrivedCount: arrivals?.unansweredCount,
          },
        ]
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
            {chip.arrivedCount === undefined ? (
              <span className="font-mono text-xs whitespace-nowrap">{chip.count}</span>
            ) : (
              <span className="font-mono text-xs whitespace-nowrap">
                {chip.arrivedCount}/{chip.count}{' '}
                <span className="sr-only">arrived</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
