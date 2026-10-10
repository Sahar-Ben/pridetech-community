import type { DecisionKind } from './decision'

/* Where the person went, said once their card has gone: an approval is a new
   row on the Members tab, and the other two only change which list they are
   on, which is where to look to change it back. */
export const describeConfirmedDecision = ({
  kind,
  applicantName,
}: {
  kind: DecisionKind
  applicantName: string
}): string => {
  if (kind === 'approve') {
    return `${applicantName} was approved and added to Members.`
  }
  if (kind === 'decline') {
    return `${applicantName} was declined. They are on the Declined list.`
  }
  return `${applicantName} was kept for later. They are on the Maybe list.`
}
