const DATE_PART_WIDTH = 2

const padded = (part: number): string => String(part).padStart(DATE_PART_WIDTH, '0')

/* Built from the local parts rather than sliced out of an ISO string: the
   reviewer is in Israel, and `toISOString` would stamp yesterday on anything
   approved before three in the morning. */
export const formatApprovalDate = (date: Date): string =>
  `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`
