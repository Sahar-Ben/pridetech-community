import { useEffect } from 'react'
import {
  buildMemberEventHistory,
  summariseMemberEvents,
  type MemberEventEntry,
  type MemberEventStatus,
} from './memberEventHistory'
import type { CommunityEventHistoryResource } from './useCommunityEventHistory'
import { formatEventDate, toIsoDateString } from '../events/eventDate'
import type { Member } from '../members/member'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const STATUS_LABELS: Readonly<Record<MemberEventStatus, string>> = {
  attended: 'Attended',
  'no-show': 'No-show',
  waitlist: 'Waitlist',
  registered: 'Registered',
  'not-recorded': 'Registered · attendance not recorded',
}

const STATUS_CLASSES: Readonly<Record<MemberEventStatus, string>> = {
  attended: 'font-semibold text-ink',
  'no-show': 'font-semibold text-warning-ink',
  waitlist: 'text-ink-muted',
  registered: 'text-ink',
  'not-recorded': 'text-ink-muted',
}

const BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} self-start`

const pluralise = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`

const describeSummary = (entries: readonly MemberEventEntry[]): string => {
  const { eventCount, attendedCount, noShowCount } = summariseMemberEvents(entries)
  return [
    `Registered for ${pluralise(eventCount, 'event', 'events')}`,
    `attended ${attendedCount}`,
    ...(noShowCount > 0 ? [pluralise(noShowCount, 'no-show', 'no-shows')] : []),
  ].join(' \u{00b7} ')
}

const describeEntryNote = (entry: MemberEventEntry): string | undefined => {
  if (entry.isWalkIn) {
    return 'walk-in'
  }
  if (entry.isMatchedByName) {
    return 'matched by name'
  }
  return undefined
}

type MemberEventHistoryPanelProps = {
  member: Member
  members: readonly Member[]
  resource: CommunityEventHistoryResource
}

export const MemberEventHistoryPanel = ({ member, members, resource }: MemberEventHistoryPanelProps) => {
  const { state, request, reload } = resource

  useEffect(() => {
    request()
  }, [request])

  return (
    <section aria-label="Event history" className="flex flex-col gap-2 rounded-xl border border-dashed border-edge px-4 py-3">
      <h4 className="text-sm font-bold text-ink">Event history</h4>

      {(state.status === 'idle' || state.status === 'loading') && (
        <p className="text-sm text-ink-muted" role="status">
          Reading every event&apos;s registrants and the Attendance tab&hellip;
        </p>
      )}

      {state.status === 'failed' && (
        <>
          {/* Not an alert: the history is beside the member, and a failure to read
              it must not talk over a save that failed on the same screen. */}
          <p className="text-sm text-warning-ink">{state.message}</p>
          <button className={BUTTON_CLASSES} onClick={reload} type="button">
            Try again
          </button>
        </>
      )}

      {state.status === 'ready' && (
        <MemberEventList
          entries={buildMemberEventHistory({
            member,
            members,
            history: state.history,
            today: toIsoDateString(new Date()),
          })}
          unreadSheetCount={state.history.unreadSheets.length}
        />
      )}
    </section>
  )
}

const MemberEventList = ({
  entries,
  unreadSheetCount,
}: {
  entries: readonly MemberEventEntry[]
  unreadSheetCount: number
}) => (
  <>
    {entries.length === 0 ? (
      <p className="text-sm text-ink-muted">Not on the registrant list of any event.</p>
    ) : (
      <>
        <p className="text-sm font-semibold text-ink">{describeSummary(entries)}</p>
        <ul aria-label="Events" className="flex flex-col divide-y divide-hairline">
          {entries.map((entry) => {
            const note = describeEntryNote(entry)
            return (
              <li className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5 text-sm" key={entry.event.id}>
                <span className="text-ink">
                  <span className="font-semibold">{entry.event.name}</span>
                  <span className="text-ink-muted"> {'\u{00b7}'} {formatEventDate(entry.event.date)}</span>
                  {note !== undefined && <span className="text-xs text-ink-muted"> ({note})</span>}
                </span>
                <span className={STATUS_CLASSES[entry.status]}>{STATUS_LABELS[entry.status]}</span>
              </li>
            )
          })}
        </ul>
      </>
    )}
    {unreadSheetCount > 0 && (
      <p className="text-xs text-warning-ink">
        {pluralise(unreadSheetCount, 'event sheet', 'event sheets')} could not be read, so this list may be
        missing events. Use &quot;Give access to event sheets&quot; on the Events page.
      </p>
    )}
  </>
)
