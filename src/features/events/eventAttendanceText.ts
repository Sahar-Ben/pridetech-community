import type { EventAttendanceSummary } from './eventAttendance'

const SEPARATOR = ' \u{00b7} '

const describeNoShows = (noShowCount: number): string =>
  `${noShowCount} no-show${noShowCount === 1 ? '' : 's'}`

const joinParts = (parts: readonly string[]): string => parts.join(SEPARATOR)

/* A row is scanned, so it carries only what is true of that event: a waitlist
   that exists, arrivals that have happened, no-shows that were concluded. */
export const describeAttendanceForListing = (summary: EventAttendanceSummary): string =>
  joinParts([
    `${summary.registeredCount} registered`,
    ...(summary.waitlistCount > 0 ? [`${summary.waitlistCount} on the waitlist`] : []),
    ...(summary.checkedInCount > 0 ? [`${summary.checkedInCount} checked in`] : []),
    ...(summary.noShowCount === undefined ? [] : [describeNoShows(summary.noShowCount)]),
  ])

export const describeAttendanceForEvent = (summary: EventAttendanceSummary): string =>
  joinParts([
    `${summary.registeredCount} registered`,
    `${summary.checkedInCount} checked in`,
    `${summary.waitlistCount} on the waitlist`,
    ...(summary.noShowCount === undefined ? [] : [describeNoShows(summary.noShowCount)]),
  ])

/* An event nobody has opened yet has not had its sheets read, and "0
   registered" would be a claim about a sheet the app has not looked at. */
export const describeUnreadRegistrantsForListing = ({
  hasAttachedSheet,
}: {
  hasAttachedSheet: boolean
}): string =>
  hasAttachedSheet
    ? 'Open the event to read its registrants'
    : 'No response sheet attached yet'
