import { useId } from 'react'
import {
  countActiveFilters,
  LEAD_SORT_LABELS,
  LINKEDIN_FILTER_LABELS,
  type LeadListQuery,
} from './leadListQuery'

const SEARCH_CLASSES = [
  'h-12 w-full rounded-2xl border border-edge bg-card pr-4 pl-11 text-base text-ink',
  'placeholder:text-ink-faint transition-[border-color] duration-150 ease-brand focus:border-accent',
].join(' ')

const FILTER_BUTTON_CLASSES = [
  'relative flex h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-card-strong-edge bg-card px-3.5',
  'text-sm font-semibold text-ink transition-colors duration-150 ease-brand hover:bg-surface',
].join(' ')

const ACTIVE_CHIP_CLASSES = [
  'flex min-h-9 items-center gap-1.5 rounded-full border border-accent/50 bg-nav-active py-1 pr-1.5 pl-3',
  'text-[13px] text-accent',
].join(' ')

const REMOVE_BUTTON_CLASSES =
  'flex size-7 items-center justify-center rounded-full hover:bg-accent/20'

type ActiveChip = {
  key: string
  label: string
  clear: Partial<LeadListQuery>
}

const activeChipsOf = (query: LeadListQuery): readonly ActiveChip[] => [
  ...(query.sort === 'newest'
    ? []
    : [{ key: 'sort', label: LEAD_SORT_LABELS[query.sort], clear: { sort: 'newest' as const } }]),
  ...(query.city === undefined
    ? []
    : [{ key: 'city', label: query.city, clear: { city: undefined } }]),
  ...(query.interest === undefined
    ? []
    : [{ key: 'interest', label: query.interest, clear: { interest: undefined } }]),
  ...(query.linkedIn === 'any'
    ? []
    : [
        {
          key: 'linkedIn',
          label: LINKEDIN_FILTER_LABELS[query.linkedIn],
          clear: { linkedIn: 'any' as const },
        },
      ]),
]

type LeadsToolbarProps = {
  query: LeadListQuery
  shownCount: number
  totalCount: number
  isSheetOpen: boolean
  onQueryChange: (query: LeadListQuery) => void
  onOpenSheet: () => void
  onClearAll: () => void
}

/* Search is always on screen, because it is the one control used on nearly
   every visit; the rest sit behind one button so the cards start high on a
   phone. What is in force is repeated as removable chips under the bar, so a
   narrowed list never looks like a short queue. */
export const LeadsToolbar = ({
  query,
  shownCount,
  totalCount,
  isSheetOpen,
  onQueryChange,
  onOpenSheet,
  onClearAll,
}: LeadsToolbarProps) => {
  const searchId = useId()
  const activeFilterCount = countActiveFilters(query)
  const chips = activeChipsOf(query)
  const isNarrowed = shownCount !== totalCount

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <div className="relative min-w-0 grow">
          <label className="sr-only" htmlFor={searchId}>
            Search applications
          </label>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-3.5 left-3.5 text-ink-muted"
            fill="none"
            height="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            className={SEARCH_CLASSES}
            enterKeyHint="search"
            id={searchId}
            onChange={(event) => onQueryChange({ ...query, searchText: event.target.value })}
            placeholder="Search applications"
            type="search"
            value={query.searchText}
          />
        </div>
        <button
          aria-expanded={isSheetOpen}
          aria-haspopup="dialog"
          aria-label={
            activeFilterCount > 0 ? `Sort & filter, ${activeFilterCount} active` : 'Sort & filter'
          }
          className={FILTER_BUTTON_CLASSES}
          onClick={onOpenSheet}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="18"
          >
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </svg>
          {/* On a phone the button is the icon and its count, so the search
              box keeps the width people type into; the name is on the button
              either way. */}
          <span className="max-sm:hidden">Sort & filter</span>
          {activeFilterCount > 0 && (
            <span
              aria-hidden="true"
              className="rounded-full bg-accent-solid px-1.5 font-mono text-[11px] font-bold text-on-accent"
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <ul aria-label="Active sort and filters" className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <li className={ACTIVE_CHIP_CLASSES} key={chip.key}>
              {chip.label}
              <button
                aria-label={`Remove ${chip.label}`}
                className={REMOVE_BUTTON_CLASSES}
                onClick={() => onQueryChange({ ...query, ...chip.clear })}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.4"
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isNarrowed && (
        <p
          className="flex items-center justify-between gap-3 font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase"
          role="status"
        >
          <span>
            Showing {shownCount} of {totalCount}
          </span>
          <button
            className="min-h-9 rounded-xl px-2 font-sans text-[13px] font-semibold tracking-normal text-accent normal-case hover:bg-surface"
            onClick={onClearAll}
            type="button"
          >
            Clear all
          </button>
        </p>
      )}
    </div>
  )
}
