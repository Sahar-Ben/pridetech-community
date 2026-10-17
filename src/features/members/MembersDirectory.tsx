import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CopyEmailsButton } from './CopyEmailsButton'
import { EventCountFilterChips } from './EventCountFilterChips'
import { MemberDetail } from './MemberDetail'
import { MembersFilterBar } from './MembersFilterBar'
import { MembersSummary } from './MembersSummary'
import { MembersTable } from './MembersTable'
import type { Member } from './member'
import { filterMembers, type MemberStatusFilter } from './memberFilters'
import { buildMemberEmailList } from './memberEmailList'
import { useDebouncedValue } from './useDebouncedValue'
import {
  countEventsByMember,
  doesEventCountMatch,
  EVENT_COUNT_FILTERS,
  type EventCountFilter,
} from '../eventHistory/memberEventCounts'
import type { CommunityEventHistoryResource } from '../eventHistory/useCommunityEventHistory'
import { toIsoDateString } from '../events/eventDate'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import type { SaveMember } from './useMemberSave'
import { SectionTitle } from '../../app/SectionTitle'
import { EMPTY_STATE_CLASSES } from '../../theme/surfaces'

const SEARCH_SETTLE_MILLISECONDS = 200

type MembersDirectoryProps = {
  members: readonly Member[]
  onSaveMember: SaveMember
  renderEventHistory: (member: Member) => ReactNode
  /* Every event's registrants, read only once somebody filters by events: it
     is a read per response sheet, and the directory is useful without it. */
  eventHistory: CommunityEventHistoryResource
  initialEventCountFilter?: EventCountFilter
}

const TRY_AGAIN_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} min-h-11 self-start`

const NOTICE_CLASSES = 'rounded-xl border border-dashed border-edge px-4 py-3 text-sm'

export const MembersDirectory = ({
  members,
  onSaveMember,
  renderEventHistory,
  eventHistory,
  initialEventCountFilter = 'any',
}: MembersDirectoryProps) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('Active')
  const [eventCountFilter, setEventCountFilter] = useState<EventCountFilter>(initialEventCountFilter)
  const [openRowNumber, setOpenRowNumber] = useState<number | undefined>(undefined)
  const [rowNumberToFocus, setRowNumberToFocus] = useState<number | undefined>(undefined)

  const settledSearchText = useDebouncedValue({
    value: searchText,
    delayInMilliseconds: SEARCH_SETTLE_MILLISECONDS,
  })

  const historyState = eventHistory.state
  const eventCounts = useMemo(
    () =>
      historyState.status === 'ready'
        ? countEventsByMember({
            members,
            history: historyState.history,
            today: toIsoDateString(new Date()),
          })
        : undefined,
    [historyState, members],
  )

  const searchedMembers = useMemo(
    () => filterMembers({ members, searchText: settledSearchText, statusFilter }),
    [members, settledSearchText, statusFilter],
  )

  /* Until every event has been read there is no honest answer to "who has
     been to none", so a list filtered by events waits rather than shows
     everybody under a chip that says otherwise. */
  const isWaitingForEvents = eventCountFilter !== 'any' && eventCounts === undefined

  const visibleMembers = useMemo(
    () =>
      eventCounts === undefined || eventCountFilter === 'any'
        ? searchedMembers
        : searchedMembers.filter((member) =>
            doesEventCountMatch({
              count: eventCounts.get(member.rowNumber) ?? 0,
              filter: eventCountFilter,
            }),
          ),
    [eventCountFilter, eventCounts, searchedMembers],
  )

  const chipCounts = useMemo(
    () =>
      eventCounts === undefined
        ? undefined
        : Object.fromEntries(
            EVENT_COUNT_FILTERS.map((filter) => [
              filter,
              searchedMembers.filter((member) =>
                doesEventCountMatch({ count: eventCounts.get(member.rowNumber) ?? 0, filter }),
              ).length,
            ]),
          ) as Record<EventCountFilter, number>,
    [eventCounts, searchedMembers],
  )

  const emailList = useMemo(() => buildMemberEmailList(visibleMembers), [visibleMembers])

  const { request: requestEventHistory } = eventHistory
  /* Arriving already filtered, from the Overview, needs the events read just as
     choosing a filter here does. */
  useEffect(() => {
    if (initialEventCountFilter !== 'any') {
      requestEventHistory()
    }
  }, [initialEventCountFilter, requestEventHistory])

  const chooseEventCountFilter = useCallback(
    (filter: EventCountFilter) => {
      setEventCountFilter(filter)
      if (filter !== 'any') {
        requestEventHistory()
      }
    },
    [requestEventHistory],
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
          <EventCountFilterChips
            counts={chipCounts}
            filter={eventCountFilter}
            onFilterChange={chooseEventCountFilter}
          />
          {eventCountFilter !== 'any' && historyState.status === 'failed' && (
            <div className={`${NOTICE_CLASSES} flex flex-col gap-2 text-warning-ink`}>
              <p>{historyState.message}</p>
              <button className={TRY_AGAIN_CLASSES} onClick={eventHistory.reload} type="button">
                Try again
              </button>
            </div>
          )}
          {isWaitingForEvents && historyState.status !== 'failed' && (
            <p className={`${NOTICE_CLASSES} text-ink-muted`} role="status">
              Counting everybody&apos;s events from every event&apos;s registrants&hellip;
            </p>
          )}
          {eventCountFilter !== 'any' &&
            historyState.status === 'ready' &&
            historyState.history.unreadSheets.length > 0 && (
              <p className={`${NOTICE_CLASSES} text-warning-ink`}>
                {historyState.history.unreadSheets.length} event sheets could not be read, so
                some members may have been to more events than shown. Use &quot;Give access to
                event sheets&quot; on the Events page.
              </p>
            )}
          {isWaitingForEvents ? null : visibleMembers.length === 0 ? (
            <p className={EMPTY_STATE_CLASSES}>No members match this search.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                Showing {visibleMembers.length} of {members.length}
              </p>
              <CopyEmailsButton list={emailList} />
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
