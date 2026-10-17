import { SegmentedFilter, type SegmentedOption } from './SegmentedFilter'
import {
  EVENT_COUNT_FILTER_LABELS,
  EVENT_COUNT_FILTERS,
  type EventCountFilter,
} from '../eventHistory/memberEventCounts'

/* The number alone in the cell, under a heading that says what it counts:
   "0 / 1 / 2 / 3+" fits a phone in one row where "No events / 1 event" wrapped
   onto two. */
const SHORT_LABELS: Readonly<Record<EventCountFilter, string>> = {
  any: 'All',
  none: '0',
  one: '1',
  two: '2',
  'three-or-more': '3+',
}

type EventCountFilterChipsProps = {
  filter: EventCountFilter
  /* How many of the members on screen fall under each cell, once every event
     has been read; until then the cells carry no number rather than a wrong
     one. */
  counts: Readonly<Record<EventCountFilter, number>> | undefined
  onFilterChange: (filter: EventCountFilter) => void
}

export const EventCountFilterChips = ({ filter, counts, onFilterChange }: EventCountFilterChipsProps) => {
  const options: readonly SegmentedOption<EventCountFilter>[] = EVENT_COUNT_FILTERS.map(
    (option) => ({
      value: option,
      label: SHORT_LABELS[option],
      spokenLabel: EVENT_COUNT_FILTER_LABELS[option],
      count: counts === undefined || option === 'any' ? undefined : counts[option],
    }),
  )

  return (
    <SegmentedFilter
      label="Events attended"
      onSelect={onFilterChange}
      options={options}
      selected={filter}
    />
  )
}
