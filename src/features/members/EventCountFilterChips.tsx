import {
  EVENT_COUNT_FILTER_LABELS,
  EVENT_COUNT_FILTERS,
  type EventCountFilter,
} from '../eventHistory/memberEventCounts'

const CHIP_BASE_CLASSES =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm transition-colors duration-150 ease-brand'

const chipClasses = (isSelected: boolean): string =>
  [
    CHIP_BASE_CLASSES,
    isSelected
      ? 'bg-accent-solid font-bold text-on-accent'
      : 'border border-card-strong-edge bg-card text-neutral-ink hover:bg-surface',
  ].join(' ')

type EventCountFilterChipsProps = {
  filter: EventCountFilter
  /* How many of the members on screen fall under each chip, once every event
     has been read; until then the chips carry no number rather than a wrong
     one. */
  counts: Readonly<Record<EventCountFilter, number>> | undefined
  onFilterChange: (filter: EventCountFilter) => void
}

export const EventCountFilterChips = ({ filter, counts, onFilterChange }: EventCountFilterChipsProps) => (
  <div aria-label="Events" className="flex flex-wrap gap-2" role="group">
    {EVENT_COUNT_FILTERS.map((option) => (
      <button
        aria-pressed={filter === option}
        className={chipClasses(filter === option)}
        key={option}
        onClick={() => onFilterChange(option)}
        type="button"
      >
        {EVENT_COUNT_FILTER_LABELS[option]}
        {/* The space keeps a screen reader from running the label and the
            number together. */}
        {counts !== undefined && option !== 'any' && (
          <>
            {' '}
            <span className="font-mono text-xs">{counts[option]}</span>
          </>
        )}
      </button>
    ))}
  </div>
)
