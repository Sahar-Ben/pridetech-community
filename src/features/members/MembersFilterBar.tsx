import { useId } from 'react'
import { MEMBER_STATUS_FILTERS, type MemberStatusFilter } from './memberFilters'
import { FIELD_BORDER_CLASSES } from '../../theme/fields'

const SEARCH_CLASSES = [
  'h-[52px] w-full rounded-2xl border bg-card pr-4 pl-12 text-base text-ink',
  'placeholder:text-ink-faint',
  'transition-[border-color,box-shadow] duration-150 ease-brand',
  FIELD_BORDER_CLASSES,
].join(' ')

const CHIP_BASE_CLASSES = [
  'min-h-11 rounded-full px-4 text-sm transition-colors duration-150 ease-brand',
].join(' ')

const chipClasses = (isSelected: boolean): string =>
  [
    CHIP_BASE_CLASSES,
    isSelected
      ? 'bg-accent-solid font-bold text-on-accent'
      : 'border border-card-strong-edge bg-card text-neutral-ink hover:bg-surface',
  ].join(' ')

/* The design's order -- the everyday view, then everything, then the rare one
   -- and its plural wording, mapped onto the filter values the list uses. */
const CHIP_ORDER: readonly MemberStatusFilter[] = ['Active', 'All', 'Ex-member']

const CHIP_LABELS: Readonly<Record<MemberStatusFilter, string>> = {
  Active: 'Active',
  All: 'All',
  'Ex-member': 'Ex-members',
}

type MembersFilterBarProps = {
  searchText: string
  statusFilter: MemberStatusFilter
  onSearchTextChange: (searchText: string) => void
  onStatusFilterChange: (statusFilter: MemberStatusFilter) => void
}

export const MembersFilterBar = ({
  searchText,
  statusFilter,
  onSearchTextChange,
  onStatusFilterChange,
}: MembersFilterBarProps) => {
  const searchInputId = useId()

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label className="sr-only" htmlFor={searchInputId}>
          Search by name, email or company
        </label>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-4 left-4 text-ink-muted"
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
          id={searchInputId}
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="Name, email or company"
          type="search"
          value={searchText}
        />
      </div>

      <div aria-label="Status" className="flex flex-wrap gap-2" role="group">
        {CHIP_ORDER.filter((option) => MEMBER_STATUS_FILTERS.includes(option)).map((option) => (
          <button
            aria-pressed={statusFilter === option}
            className={chipClasses(statusFilter === option)}
            key={option}
            onClick={() => onStatusFilterChange(option)}
            type="button"
          >
            {CHIP_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
