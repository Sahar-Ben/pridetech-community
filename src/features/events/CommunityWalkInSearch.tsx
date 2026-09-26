import { useEffect, useRef, useState } from 'react'
import { CommunitySearchResultRow } from './CommunitySearchResultRow'
import { DoorSearchField } from './DoorSearchField'
import { searchCommunityMembers } from './communitySearch'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const HINT_CLASSES = 'text-sm text-ink-muted'

type CommunityWalkInSearchProps = {
  members: readonly Member[]
  registrants: readonly Registrant[]
  onAdd: (member: Member) => void
  onCheckInExisting: (registrant: Registrant) => void
}

export const CommunityWalkInSearch = ({
  members,
  registrants,
  onAdd,
  onCheckInExisting,
}: CommunityWalkInSearchProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const results = searchCommunityMembers({ members, registrants, searchText })
  const hasSearched = searchText.trim() !== ''

  return (
    <div className="flex flex-col gap-2">
      <DoorSearchField
        inputRef={searchInputRef}
        label="Search the community list by name or email"
        onChange={setSearchText}
        value={searchText}
      />

      <p className="text-xs text-ink-muted">
        This searches your Members tab. A walk-in added here is saved to the Attendance tab.
      </p>

      {results.length > 0 && (
        <ul aria-label="Community search results" className="flex flex-col gap-2">
          {results.map((result) => (
            <li key={result.member.rowNumber}>
              <CommunitySearchResultRow
                onAdd={onAdd}
                onCheckInExisting={onCheckInExisting}
                result={result}
              />
            </li>
          ))}
        </ul>
      )}

      {hasSearched && results.length === 0 && (
        <p className={HINT_CLASSES}>
          Nobody in the member list matches that. If they are not a member, tick the box above.
        </p>
      )}

      {!hasSearched && (
        <p className={HINT_CLASSES}>Type a name or email to find them in the community list.</p>
      )}
    </div>
  )
}
