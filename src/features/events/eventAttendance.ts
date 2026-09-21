import { hasRegistrantArrived, type Registrant } from './registrant'

export const REGISTRANT_STATUSES = ['registered', 'attended', 'waitlist', 'no-show'] as const

export type RegistrantStatus = (typeof REGISTRANT_STATUSES)[number]

/* `expectedCount` is the denominator the door counts against: everyone holding
   a place, plus anyone let in off the waitlist, so the running count can never
   read "121 of 120". `noShowCount` is absent until the event is closed out. */
export type EventAttendanceSummary = {
  registeredCount: number
  checkedInCount: number
  waitlistCount: number
  expectedCount: number
  noShowCount: number | undefined
}

const isHoldingAPlace = (registrant: Registrant): boolean => registrant.registration === 'registered'

/* No-show is a conclusion, not a live state. Until the organiser closes the
   event out, everybody who has not been tapped is simply not here yet. */
export const deriveRegistrantStatus = ({
  registrant,
  isClosedOut,
}: {
  registrant: Registrant
  isClosedOut: boolean
}): RegistrantStatus => {
  if (hasRegistrantArrived(registrant)) {
    return 'attended'
  }
  if (registrant.registration === 'waitlist') {
    return 'waitlist'
  }
  return isClosedOut ? 'no-show' : 'registered'
}

const countMatching = (
  registrants: readonly Registrant[],
  doesMatch: (registrant: Registrant) => boolean,
): number => registrants.filter(doesMatch).length

export const summariseEventAttendance = ({
  registrants,
  isClosedOut,
}: {
  registrants: readonly Registrant[]
  isClosedOut: boolean
}): EventAttendanceSummary => {
  const noShowCount = countMatching(
    registrants,
    (registrant) => deriveRegistrantStatus({ registrant, isClosedOut }) === 'no-show',
  )

  return {
    registeredCount: countMatching(registrants, isHoldingAPlace),
    checkedInCount: countMatching(registrants, hasRegistrantArrived),
    waitlistCount: countMatching(registrants, (registrant) => !isHoldingAPlace(registrant)),
    expectedCount: countMatching(
      registrants,
      (registrant) => isHoldingAPlace(registrant) || hasRegistrantArrived(registrant),
    ),
    noShowCount: isClosedOut ? noShowCount : undefined,
  }
}
