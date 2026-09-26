const BASE_36 = 36
const RANDOM_DIGITS = 4
const RANDOM_RANGE = BASE_36 ** RANDOM_DIGITS

/* Nine base-36 digits hold every millisecond from 1973 to 4453, so the time
   part is a fixed width and two ids compare as text in the order they were
   made. Without the padding, an id made in 2033 would sort before one made in
   2026 the moment the digit count changed. */
const TIME_DIGITS = 9

const EVENT_ID_SHAPE = /^evt-[0-9a-z]+-[0-9a-z]{4}$/

/* An event's identity is a cell, never its row: the organiser sorts this tab by
   date, and every attendance row ever written points back here. The id is made
   of the moment it was created and four random digits, so two events added in
   the same second by two people are still two events, and nothing about it can
   be recomputed from the row's contents — which is the point, because a rename
   must not turn an event into a different one.

   `evt-` in front keeps the cell text: a bare base-36 run like `1e5` is a
   number to a spreadsheet, and this app writes RAW but a person editing the
   cell is not this app. */
export const buildEventId = ({
  now,
  randomValue,
}: {
  now: Date
  randomValue: number
}): string => {
  const madeAt = now.getTime().toString(BASE_36).padStart(TIME_DIGITS, '0')
  const boundedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
  const suffix = Math.floor(boundedRandom * RANDOM_RANGE)
    .toString(BASE_36)
    .padStart(RANDOM_DIGITS, '0')
  return `evt-${madeAt}-${suffix}`
}

export const isEventIdShape = (value: string): boolean => EVENT_ID_SHAPE.test(value)

export const createEventId = (): string =>
  buildEventId({ now: new Date(), randomValue: Math.random() })
