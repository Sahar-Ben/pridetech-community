import type { LeadsReview, ReviewableApplication } from './leadsReview'

/* Two views, not three. Approved is deliberately absent: 824 of the 1,080 rows
   carry it, they are the Members tab said a second time, and putting them here
   would turn the one screen that is a work queue into a browser of the sheet. */
export const LEAD_VIEWS = ['Pending', 'Declined'] as const

export type LeadView = (typeof LEAD_VIEWS)[number]

export const selectApplicationsInView = ({
  review,
  view,
}: {
  review: LeadsReview
  view: LeadView
}): readonly ReviewableApplication[] =>
  view === 'Declined' ? review.declinedApplications : review.waitingApplications

/* Declining is offered on a pending application and nowhere else. Declining one
   that is already declined would write the value the cell already holds, and the
   undo somebody would ask for next \u{2014} blanking the Status back to empty \u{2014} is
   the one write this app must never make: blank means nobody has reviewed this
   person, and manufacturing it would hide a decision that was taken. The way
   back from a decline is an approval, which is why that button stays. */
export const isDecliningOffered = ({ view }: { view: LeadView }): boolean => view === 'Pending'
