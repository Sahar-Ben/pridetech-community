import { useId } from 'react'
import { MEMBER_STATUS_FILTERS, type MemberStatusFilter } from './memberFilters'

const LABEL_CLASSES = 'text-xs font-medium text-slate-500 dark:text-slate-400'

const CONTROL_CLASSES =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const isMemberStatusFilter = (value: string): value is MemberStatusFilter =>
  MEMBER_STATUS_FILTERS.some((statusFilter) => statusFilter === value)

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
  const statusSelectId = useId()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label className={LABEL_CLASSES} htmlFor={searchInputId}>
          Search by name, email or company
        </label>
        <input
          className={`${CONTROL_CLASSES} w-full`}
          id={searchInputId}
          onChange={(event) => onSearchTextChange(event.target.value)}
          type="search"
          value={searchText}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASSES} htmlFor={statusSelectId}>
          Status
        </label>
        <select
          className={CONTROL_CLASSES}
          id={statusSelectId}
          onChange={(event) => {
            const selected = event.target.value
            if (isMemberStatusFilter(selected)) {
              onStatusFilterChange(selected)
            }
          }}
          value={statusFilter}
        >
          {MEMBER_STATUS_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
