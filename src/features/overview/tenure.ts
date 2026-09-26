export const TENURE_BUCKETS = [
  { key: 'under-1-year', label: 'Under 1 year', maximumYears: 1 },
  { key: 'one-to-two-years', label: '1 to 2 years', maximumYears: 2 },
  { key: 'two-to-four-years', label: '2 to 4 years', maximumYears: 4 },
  { key: 'four-years-or-more', label: '4 years or more', maximumYears: Number.POSITIVE_INFINITY },
] as const

/* Members are added to the sheet by hand as well as through the form, and the
   form's own tab only goes back so far, so a member with no application is an
   ordinary case rather than an error. It is shown as its own band. */
export const UNKNOWN_TENURE_BUCKET = {
  key: 'no-application',
  label: 'No application to date from',
} as const

/* Calendar years rather than a division by 365.25: somebody who applied on the
   29th of February has an anniversary, and a member reads "2 years" as "we are
   past the second anniversary", not "730 days have elapsed". */
const completedYearsBetween = ({ appliedAt, asOf }: { appliedAt: Date; asOf: Date }): number => {
  const years = asOf.getFullYear() - appliedAt.getFullYear()
  const isPastThisYearsAnniversary =
    asOf.getMonth() > appliedAt.getMonth() ||
    (asOf.getMonth() === appliedAt.getMonth() && asOf.getDate() >= appliedAt.getDate())
  return isPastThisYearsAnniversary ? years : years - 1
}

export const toTenureBucketKey = ({
  appliedAt,
  asOf,
}: {
  appliedAt: Date | undefined
  asOf: Date
}): string => {
  if (appliedAt === undefined) {
    return UNKNOWN_TENURE_BUCKET.key
  }
  const completedYears = completedYearsBetween({ appliedAt, asOf })
  /* An application stamped after today is a mistyped cell, and the honest thing
     to say about it is that we cannot date this member — not that they are
     the community's newest. */
  if (completedYears < 0) {
    return UNKNOWN_TENURE_BUCKET.key
  }
  const bucket = TENURE_BUCKETS.find((band) => completedYears < band.maximumYears)
  return bucket?.key ?? UNKNOWN_TENURE_BUCKET.key
}
