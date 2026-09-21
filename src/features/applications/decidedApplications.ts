import type { LeadsReview, ReviewableApplication } from './leadsReview'

const withoutRowNumbers = ({
  applications,
  decidedRowNumbers,
}: {
  applications: readonly ReviewableApplication[]
  decidedRowNumbers: ReadonlySet<number>
}): readonly ReviewableApplication[] =>
  applications.filter((application) => !decidedRowNumbers.has(application.lead.rowNumber))

/* A decided application leaves the list it was decided from without the sheet
   being read again: rereading a thousand rows after every click would make the
   queue unusable, and the one thing that changed is already known. Both lists
   are filtered because both can be acted on \u{2014} an approval taken from the
   declined list has just rewritten that row's Status too. Only those two counts
   move with it \u{2014} the rest describe the sheet as it was read, and the decision
   did not fix a missing address or merge a repeated row. */
export const withoutDecidedApplications = ({
  review,
  decidedRowNumbers,
}: {
  review: LeadsReview
  decidedRowNumbers: ReadonlySet<number>
}): LeadsReview => {
  if (decidedRowNumbers.size === 0) {
    return review
  }
  const waitingApplications = withoutRowNumbers({
    applications: review.waitingApplications,
    decidedRowNumbers,
  })
  const declinedApplications = withoutRowNumbers({
    applications: review.declinedApplications,
    decidedRowNumbers,
  })
  return {
    ...review,
    waitingApplications,
    declinedApplications,
    counts: {
      ...review.counts,
      waitingCount: waitingApplications.length,
      declinedCount: declinedApplications.length,
    },
  }
}
