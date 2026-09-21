import { useCallback, useState } from 'react'
import { LocalOnlySaveNotice } from './LocalOnlySaveNotice'
import { MemberDetail } from './MemberDetail'
import { MembersFilterBar } from './MembersFilterBar'
import { MembersSummary } from './MembersSummary'
import { MembersTable } from './MembersTable'
import type { Member } from './member'
import { filterMembers, type MemberStatusFilter } from './memberFilters'
import { replaceMember } from './memberUpdates'

type MembersDirectoryProps = {
  members: readonly Member[]
}

export const MembersDirectory = ({ members: loadedMembers }: MembersDirectoryProps) => {
  const [members, setMembers] = useState<readonly Member[]>(loadedMembers)
  const [hasLocalOnlyEdits, setHasLocalOnlyEdits] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('Active')
  const [openRowNumber, setOpenRowNumber] = useState<number | undefined>(undefined)
  const [rowNumberToFocus, setRowNumberToFocus] = useState<number | undefined>(undefined)

  const visibleMembers = filterMembers({ members, searchText, statusFilter })
  const openMember = members.find((member) => member.rowNumber === openRowNumber)

  const openDetail = useCallback((member: Member) => {
    setOpenRowNumber(member.rowNumber)
  }, [])

  const closeDetail = useCallback(() => {
    setRowNumberToFocus(openRowNumber)
    setOpenRowNumber(undefined)
  }, [openRowNumber])

  const saveMember = useCallback((updatedMember: Member) => {
    setMembers((currentMembers) => replaceMember({ members: currentMembers, updatedMember }))
    setHasLocalOnlyEdits(true)
  }, [])

  const forgetFocusRequest = useCallback(() => {
    setRowNumberToFocus(undefined)
  }, [])

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10">
      <header className="py-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Members</h2>
      </header>

      {openMember === undefined ? (
        <div className="flex flex-col gap-4">
          {hasLocalOnlyEdits && <LocalOnlySaveNotice />}
          <MembersSummary members={members} />
          <MembersFilterBar
            onSearchTextChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            searchText={searchText}
            statusFilter={statusFilter}
          />
          {visibleMembers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No members match this search.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
        <MemberDetail member={openMember} onClose={closeDetail} onSave={saveMember} />
      )}
    </section>
  )
}
