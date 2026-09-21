import type { Registrant } from './registrant'

export const selectEventRegistrants = ({
  registrants,
  eventId,
}: {
  registrants: readonly Registrant[]
  eventId: string
}): readonly Registrant[] => registrants.filter((registrant) => registrant.eventId === eventId)

export const sortRegistrantsByName = (
  registrants: readonly Registrant[],
): readonly Registrant[] =>
  registrants.toSorted((earlier, later) =>
    earlier.name.localeCompare(later.name, undefined, { sensitivity: 'base' }),
  )
