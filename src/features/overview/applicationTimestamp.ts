const MONTH_FIRST_STAMP = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s.*)?$/
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/

type DateParts = {
  year: number
  month: number
  day: number
}

/* `new Date(2025, 1, 30)` is the first of March rather than an error, so the
   parts are read back off the date they produced. A day the month does not have
   is a cell somebody mistyped, and dating a member from it is worse than
   reporting that the member has no date. */
const toDate = ({ year, month, day }: DateParts): Date | undefined => {
  const date = new Date(year, month - 1, day)
  const isTheDayItWasAskedFor =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isTheDayItWasAskedFor ? date : undefined
}

const toParts = (timestamp: string): DateParts | undefined => {
  const isoParts = ISO_DATE.exec(timestamp)
  if (isoParts !== null) {
    return { year: Number(isoParts[1]), month: Number(isoParts[2]), day: Number(isoParts[3]) }
  }
  const monthFirstParts = MONTH_FIRST_STAMP.exec(timestamp)
  if (monthFirstParts === null) {
    return undefined
  }
  return {
    year: Number(monthFirstParts[3]),
    month: Number(monthFirstParts[1]),
    day: Number(monthFirstParts[2]),
  }
}

/* Month-first, because that is what the Google Form writes into this
   spreadsheet: `3/8/2025 14:25:20` is the 8th of March. The sheet's locale is
   the only thing that decides this, and it is not recorded anywhere in the
   sheet itself — so a tenure figure is no better than that assumption, and
   `Date.parse` is avoided precisely because it would make the same guess
   silently and differently per browser. */
export const toApplicationDate = (timestamp: string | undefined): Date | undefined => {
  const trimmed = timestamp?.trim()
  if (trimmed === undefined || trimmed === '') {
    return undefined
  }
  const parts = toParts(trimmed)
  if (parts === undefined) {
    return undefined
  }
  return toDate(parts)
}
