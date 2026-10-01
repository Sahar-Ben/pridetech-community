import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { MemberDetail } from './MemberDetail'
import { MembersFilterBar } from './MembersFilterBar'
import { MembersSummary } from './MembersSummary'
import { MembersTable } from './MembersTable'
import type { Member } from './member'
import { filterMembers, type MemberStatusFilter } from './memberFilters'
import { useDebouncedValue } from './useDebouncedValue'
import type { SaveMember } from './useMemberSave'
import { SectionTitle } from '../../app/SectionTitle'
import { EMPTY_STATE_CLASSES } from '../../theme/surfaces'

const SEARCH_SETTLE_MILLISECONDS = 200

type MembersDirectoryProps = {
  members: readonly Member[]
  onSaveMember: SaveMember
  renderEventHistory: (member: Member) => ReactNode
}

export const MembersDirectory = ({
  members,
  onSaveMember,
  renderEventHistory,
}: MembersDirectoryProps) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('Active')
  const [openRowNumber, setOpenRowNumber] = useState<number | undefined>(undefined)
  const [rowNumberToFocus, setRowNumberToFocus] = useState<number | undefined>(undefined)

  const settledSearchText = useDebouncedValue({
    value: searchText,
    delayInMilliseconds: SEARCH_SETTLE_MILLISECONDS,
  })

  const visibleMembers = useMemo(
    () => filterMembers({ members, searchText: settledSearchText, statusFilter }),
    [members, settledSearchText, statusFilter],
  )

  const openMember = members.find((member) => member.rowNumber === openRowNumber)

  const openDetail = useCallback((member: Member) => {
    setOpenRowNumber(member.rowNumber)
  }, [])

  const closeDetail = useCallback(() => {
    setRowNumberToFocus(openRowNumber)
    setOpenRowNumber(undefined)
  }, [openRowNumber])

  const forgetFocusRequest = useCallback(() => {
    setRowNumberToFocus(undefined)
  }, [])

  const saveOpenMember = useCallback(
    async (updatedMember: Member): Promise<void> => {
      if (openMember === undefined) {
        return
      }
      await onSaveMember({ originalMember: openMember, updatedMember })
    },
    [onSaveMember, openMember],
  )

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-12">
      <header className="pt-6 pb-4">
        <SectionTitle eyebrow="Directory" title="Members" />
      </header>

      {openMember === undefined ? (
        <div className="flex flex-col gap-4">
          <MembersSummary members={members} />
          <MembersFilterBar
            onSearchTextChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            searchText={searchText}
            statusFilter={statusFilter}
          />
          {visibleMembers.length === 0 ? (
            <p className={EMPTY_STATE_CLASSES}>No members match this search.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                Showing {visibleMembers.length} of {members.length}
              </p>
              <MembersTable
                members={visibleMembers}
                onFocusRestored={forgetFocusRequest}
                onOpenMember={openDetail}
                rowNumberToFocus={rowNumberToFocus}
              />
            </div>
          )}
        </div>
      ) : (
        <MemberDetail
          eventHistory={renderEventHistory(openMember)}
          member={openMember}
          onClose={closeDetail}
          onSave={saveOpenMember}
        />
      )}
    </section>
  )
}
