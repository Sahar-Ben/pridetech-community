import { toApplicationDate } from '../overview/applicationTimestamp'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const TIME_OF_DAY = /[\sT](\d{1,2}):(\d{2})(?::\d{2})?/

const twoDigits = (value: number): string => String(value).padStart(2, '0')

export type SubmittedAt = {
  label: string
  /* For `<time dateTime>`; absent when the cell could not be read as a date. */
  dateTime: string | undefined
}

/* The Form's own stamp, `3/8/2025 14:25:20`, read the way the Overview reads
   it (month first) and written out with the month as a word, so nobody has to
   guess whether 3/8 is March or August. Months are spelled here rather than
   by the browser so every phone shows the same text. A cell that is not a
   date is shown as typed rather than hidden: it is still what the sheet
   says. */
export const describeSubmittedAt = (timestamp: string | undefined): SubmittedAt | undefined => {
  const trimmed = timestamp?.trim()
  if (trimmed === undefined || trimmed === '') {
    return undefined
  }
  const date = toApplicationDate(trimmed)
  if (date === undefined) {
    return { label: trimmed, dateTime: undefined }
  }
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  const isoDay = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`
  const time = TIME_OF_DAY.exec(trimmed)
  const hours = Number(time?.[1])
  const minutes = Number(time?.[2])
  if (time === null || hours > 23 || minutes > 59) {
    return { label: day, dateTime: isoDay }
  }
  const clock = `${twoDigits(hours)}:${twoDigits(minutes)}`
  return { label: `${day}, ${clock}`, dateTime: `${isoDay}T${clock}` }
}

/* The same day one calendar month back, or the month's last day when it is
   shorter: a month before 31 March is 28 or 29 February, not 3 March. */
const oneMonthBefore = (asOf: Date): Date => {
  const lastDayOfPreviousMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate()
  return new Date(
    asOf.getFullYear(),
    asOf.getMonth() - 1,
    Math.min(asOf.getDate(), lastDayOfPreviousMonth),
  )
}

/* Read to the day, like every other use of the stamp. A cell that is not a
   date says nothing about how long somebody has waited, so it is never
   flagged. */
export const isOverAMonthOld = ({
  timestamp,
  asOf,
}: {
  timestamp: string | undefined
  asOf: Date
}): boolean => {
  const submitted = toApplicationDate(timestamp?.trim())
  return submitted !== undefined && submitted < oneMonthBefore(asOf)
}
