const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const ISO_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/

const padToTwoDigits = (value: number): string => String(value).padStart(2, '0')

/* Spelled out rather than numeric, because this community writes dates both
   ways and `10.9` is read as two different days by two different organisers. */
export const formatEventDate = (isoDate: string): string => {
  const parts = ISO_DATE_SHAPE.exec(isoDate)
  if (parts === null) {
    return isoDate
  }
  const [, year, month, day] = parts
  if (year === undefined || month === undefined || day === undefined) {
    return isoDate
  }
  const monthName = MONTH_NAMES[Number(month) - 1]
  if (monthName === undefined) {
    return isoDate
  }
  return `${Number(day)} ${monthName} ${year}`
}

/* Built from the local calendar fields: an event that starts at 20:00 in Tel
   Aviv must not be filed under tomorrow because UTC has already turned over. */
export const toIsoDateString = (date: Date): string =>
  `${date.getFullYear()}-${padToTwoDigits(date.getMonth() + 1)}-${padToTwoDigits(date.getDate())}`
