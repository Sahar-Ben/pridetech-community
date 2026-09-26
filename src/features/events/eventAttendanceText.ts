import type { EventAttendanceSummary } from './eventAttendance'

const SEPARATOR = ' \u{00b7} '

const describeNoShows = (noShowCount: number): string =>
  `${noShowCount} no-show${noShowCount === 1 ? '' : 's'}`

const joinParts = (parts: readonly string[]): string => parts.join(SEPARATOR)

/* A row is scanned for how many came out of how many were expected, so once
   anybody has been checked in, or the door is closed, that leads. Before
   that it is the registration count; and a past event nobody checked anyone
   in at says its attendance was never recorded, rather than implying nobody
   came. The count out of is `expectedCount`, which takes in anybody let in
   off the waitlist or at the door, so it never reads "41 of 40". */
export const describeAttendanceForListing = ({
  summary,
  isPast,
  isClosedOut,
}: {
  summary: EventAttendanceSummary
  isPast: boolean
  isClosedOut: boolean
}): string => {
  const waitlist = summary.waitlistCount > 0 ? [`${summary.waitlistCount} on the waitlist`] : []
  if (isClosedOut || summary.checkedInCount > 0) {
    return joinParts([
      `${summary.checkedInCount} of ${summary.expectedCount} arrived`,
      ...(summary.noShowCount === undefined ? [] : [describeNoShows(summary.noShowCount)]),
    ])
  }
  if (isPast) {
    return joinParts([`${summary.registeredCount} registered`, 'attendance not recorded'])
  }
  return joinParts([`${summary.registeredCount} registered`, ...waitlist])
}

export const describeAttendanceForEvent = (summary: EventAttendanceSummary): string =>
  joinParts([
    `${summary.registeredCount} registered`,
    `${summary.checkedInCount} checked in`,
    `${summary.waitlistCount} on the waitlist`,
    ...(summary.noShowCount === undefined ? [] : [describeNoShows(summary.noShowCount)]),
  ])

/* An event whose sheets have not been read yet, and "0 registered" would be a
   claim about a sheet the app has not looked at. */
export const describeUnreadRegistrantsForListing = ({
  hasAttachedSheet,
}: {
  hasAttachedSheet: boolean
}): string =>
  hasAttachedSheet ? 'Reading registrants\u{2026}' : 'No response sheet attached yet'
