import type { LeadsReview } from './leadsReview'

/* A decided application leaves the queue without the sheet being read again:
   rereading a thousand rows after every click would make the queue unusable, and
   the one thing that changed is already known. Only the waiting count moves with
   it \u{2014} the other counts describe the sheet as it was read, and the decision
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
  const waitingApplications = review.waitingApplications.filter(
    (waiting) => !decidedRowNumbers.has(waiting.lead.rowNumber),
  )
  return {
    ...review,
    waitingApplications,
    counts: { ...review.counts, waitingCount: waitingApplications.length },
  }
}
