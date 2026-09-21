import { useId } from 'react'
import { MEMBER_STATUS_FILTERS, type MemberStatusFilter } from './memberFilters'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES } from '../../theme/fields'

/* The labels sit on the gradient rather than on a card, so they are white
   rather than muted ink -- the controls under them are the opaque part. */
const LABEL_CLASSES = 'text-xs font-bold tracking-wide text-on-brand uppercase'

const CONTROL_CLASSES = `${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`

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
          className={CONTROL_CLASSES}
          id={searchInputId}
          onChange={(event) => onSearchTextChange(event.target.value)}
          type="search"
          value={searchText}
        />
      </div>

      <div className="flex flex-col gap-1 sm:w-44">
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
