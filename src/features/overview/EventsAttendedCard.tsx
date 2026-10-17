import { useEffect, useMemo } from 'react'
import { DistributionTable } from './DistributionTable'
import { ProvenanceBadge } from './ProvenanceBadge'
import {
  buildEventCountDistribution,
  EVENT_COUNT_BUCKETS,
} from '../eventHistory/eventCountDistribution'
import { countEventsByMember, type EventCountFilter } from '../eventHistory/memberEventCounts'
import type { CommunityEventHistoryResource } from '../eventHistory/useCommunityEventHistory'
import { toIsoDateString } from '../events/eventDate'
import type { Member } from '../members/member'
import { selectActiveMembers } from '../members/memberFilters'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const CARD_CLASSES = `${CHART_PANEL_CLASSES} animate-rise flex flex-col gap-3 px-5 py-4`

/* Each bar is a button the width of the card, because it is the way into the
   members it counts: on a phone that is a thumb's target, not a mark to hover. */
const BAR_BUTTON_CLASSES = [
  'group grid min-h-11 w-full grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3',
  'rounded-xl px-2 py-1.5 text-left transition-colors duration-150 ease-brand hover:bg-glass-hover',
].join(' ')

const TRY_AGAIN_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} min-h-11 self-start`

const CHEVRON = '\u{203A}'

type EventsAttendedCardProps = {
  members: readonly Member[]
  resource: CommunityEventHistoryResource
  onOpenMembers: (filter: EventCountFilter) => void
}

/* How many active members have been to no event, one, two, or three and more,
   with each band opening the Members screen filtered to exactly those people,
   ready to copy their emails. Counted the way the Members filter counts: a
   place held, whether or not attendance was kept, and never a waiting list or
   a no-show. The events are read when this card first shows, and kept for the
   Members screen. */
export const EventsAttendedCard = ({ members, resource, onOpenMembers }: EventsAttendedCardProps) => {
  const { state, request, reload } = resource

  useEffect(() => {
    request()
  }, [request])

  const activeMembers = useMemo(() => selectActiveMembers(members), [members])
  const distribution = useMemo(
    () =>
      state.status === 'ready'
        ? buildEventCountDistribution({
            members: activeMembers,
            counts: countEventsByMember({
              members,
              history: state.history,
              today: toIsoDateString(new Date()),
            }),
          })
        : undefined,
    [activeMembers, members, state],
  )
  const largestCount = Math.max(1, ...(distribution?.buckets.map(({ count }) => count) ?? []))

  return (
    <section aria-labelledby="events-attended-title" className={CARD_CLASSES}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold tracking-tight text-on-brand" id="events-attended-title">
            Events attended
          </h3>
          <ProvenanceBadge provenance="derived" />
        </div>
        <p className="text-sm font-medium text-panel-deep-ink-muted">
          Each active member&apos;s registrations across every event&apos;s response sheet. An event
          counts when they held a place; a waiting list or a no-show does not. Tap a bar to see
          those members.
        </p>
      </header>

      {(state.status === 'idle' || state.status === 'loading') && (
        <p className="text-sm text-panel-deep-ink-muted" role="status">
          Reading every event&apos;s registrants&hellip;
        </p>
      )}

      {state.status === 'failed' && (
        <>
          <p className="text-sm font-semibold text-on-brand">{state.message}</p>
          <button className={TRY_AGAIN_CLASSES} onClick={reload} type="button">
            Try again
          </button>
        </>
      )}

      {distribution !== undefined && state.status === 'ready' && (
        <>
          <ul aria-label="Active members by events attended" className="flex flex-col gap-1">
            {distribution.buckets.map((bucket, index) => (
              <li key={bucket.key}>
                <button
                  aria-label={`${bucket.label}: ${bucket.count} members, ${bucket.percentage}%. Show them in Members`}
                  className={BAR_BUTTON_CLASSES}
                  onClick={() => onOpenMembers(EVENT_COUNT_BUCKETS[index] ?? 'none')}
                  type="button"
                >
                  <span className="text-sm font-semibold text-on-brand">{bucket.label}</span>
                  <span aria-hidden="true" className="h-3 rounded-full bg-glass-edge/40">
                    <span
                      className="block h-3 rounded-full bg-chart-1"
                      style={{ width: `${(bucket.count / largestCount) * 100}%` }}
                    />
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-on-brand tabular-nums">
                    {bucket.count}
                    <span className="text-panel-deep-ink-muted">{bucket.percentage}%</span>
                    <span aria-hidden="true" className="text-base text-panel-deep-ink-muted">
                      {CHEVRON}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {state.history.unreadSheets.length > 0 && (
            <p className="text-sm font-semibold text-on-brand">
              {state.history.unreadSheets.length} event sheets could not be read, so some members
              may have been to more events than shown.
            </p>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-panel-deep-ink-muted">
              Show the numbers
            </summary>
            <div className="mt-2 overflow-x-auto">
              <DistributionTable
                buckets={distribution.buckets}
                caption="Active members by how many events they have been to"
                categoryHeading="Events attended"
              />
            </div>
          </details>
        </>
      )}
    </section>
  )
}
