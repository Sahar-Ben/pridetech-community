import { hasRegistrantArrived, type Registrant } from './registrant'

/* One answer to the form's "which are you" question, and how many people gave
   it. `label` is the spelling the first of them wrote, because the answer is
   the form's wording; `key` is what two spellings of it are counted under. */
export type AttendeeTypeCount = {
  key: string
  label: string
  count: number
}

export type AttendeeTypeSummary = {
  types: readonly AttendeeTypeCount[]
  /* People who left the question blank, or who are on a sheet that does not
     ask it: they are counted rather than dropped, so the counts add up to the
     whole list. */
  unansweredCount: number
}

export type AttendeeTypeFilter =
  | { kind: 'all' }
  | { kind: 'type'; key: string }
  | { kind: 'unanswered' }

export const ALL_ATTENDEE_TYPES: AttendeeTypeFilter = { kind: 'all' }

/* A form only offers a few fixed answers, but a sheet can be typed into by
   hand, and `Recruiter` and ` recruiter` are the same answer whoever typed it. */
export const toAttendeeTypeKey = (attendeeType: string): string =>
  attendeeType.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

const readKey = (registrant: Registrant): string | undefined => {
  const key = toAttendeeTypeKey(registrant.attendeeType ?? '')
  return key === '' ? undefined : key
}

/* Largest group first, then by name, so the two halves of a careers evening
   read in the same order on every phone that opens it. */
export const summariseAttendeeTypes = (
  registrants: readonly Registrant[],
): AttendeeTypeSummary => {
  const byKey = new Map<string, AttendeeTypeCount>()
  let unansweredCount = 0

  registrants.forEach((registrant) => {
    const key = readKey(registrant)
    if (key === undefined) {
      unansweredCount += 1
      return
    }
    const counted = byKey.get(key)
    byKey.set(key, {
      key,
      label: counted?.label ?? (registrant.attendeeType ?? '').trim(),
      count: (counted?.count ?? 0) + 1,
    })
  })

  const types = [...byKey.values()].sort(
    (first, second) => second.count - first.count || first.label.localeCompare(second.label),
  )
  return { types, unansweredCount }
}

export const filterByAttendeeType = ({
  registrants,
  filter,
}: {
  registrants: readonly Registrant[]
  filter: AttendeeTypeFilter
}): readonly Registrant[] => {
  if (filter.kind === 'all') {
    return registrants
  }
  if (filter.kind === 'unanswered') {
    return registrants.filter((registrant) => readKey(registrant) === undefined)
  }
  return registrants.filter((registrant) => readKey(registrant) === filter.key)
}

/* A filter left pointing at an answer nobody gives any more, after the list was
   read again, would show an empty list with no chip lit to explain it. */
export const keepAvailableFilter = ({
  filter,
  summary,
}: {
  filter: AttendeeTypeFilter
  summary: AttendeeTypeSummary
}): AttendeeTypeFilter => {
  if (filter.kind === 'type' && !summary.types.some((type) => type.key === filter.key)) {
    return ALL_ATTENDEE_TYPES
  }
  if (filter.kind === 'unanswered' && summary.unansweredCount === 0) {
    return ALL_ATTENDEE_TYPES
  }
  return filter
}

/* How many of each answer have come through the door, for the check-in screen:
   midway through a careers evening the question is how many of the recruiters
   are here, not how many registered. */
export type AttendeeTypeArrivals = {
  byKey: ReadonlyMap<string, number>
  unansweredCount: number
  totalCount: number
}

export const summariseArrivalsByType = (
  registrants: readonly Registrant[],
): AttendeeTypeArrivals => {
  const byKey = new Map<string, number>()
  let unansweredCount = 0
  let totalCount = 0
  registrants.filter(hasRegistrantArrived).forEach((registrant) => {
    totalCount += 1
    const key = readKey(registrant)
    if (key === undefined) {
      unansweredCount += 1
      return
    }
    byKey.set(key, (byKey.get(key) ?? 0) + 1)
  })
  return { byKey, unansweredCount, totalCount }
}
