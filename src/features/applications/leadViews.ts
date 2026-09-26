import type { LeadsReview, LeadsReviewCounts, ReviewableApplication } from './leadsReview'

/* Three views, not four. Approved is deliberately absent: 824 of the 1,080 rows
   carry it, they are the Members tab said a second time, and putting them here
   would turn the one screen that is a work queue into a browser of the sheet.

   `Maybe` is the short name for the `Maybe in the future` the sheet records.
   The stored value is the reviewer's own phrase; a filter option and a button
   have to fit beside two one-word siblings. */
export const LEAD_VIEWS = ['Pending', 'Maybe', 'Declined'] as const

export type LeadView = (typeof LEAD_VIEWS)[number]

const APPLICATIONS_IN_VIEW: Readonly<
  Record<LeadView, (review: LeadsReview) => readonly ReviewableApplication[]>
> = {
  Pending: (review) => review.waitingApplications,
  Maybe: (review) => review.maybeApplications,
  Declined: (review) => review.declinedApplications,
}

export const selectApplicationsInView = ({
  review,
  view,
}: {
  review: LeadsReview
  view: LeadView
}): readonly ReviewableApplication[] => APPLICATIONS_IN_VIEW[view](review)

/* Declining is offered everywhere except on an application that is already
   declined, where it would write the value the cell already holds. The undo
   somebody would ask for next — blanking the Status back to empty — is the
   one write this app must never make, from any view: blank means nobody has
   reviewed this person, and manufacturing it would hide a decision that was
   taken. The ways out of a decline or a maybe are the other two decisions,
   which is why those buttons stay and no Pending button exists. */
export const isDecliningOffered = ({ view }: { view: LeadView }): boolean => view !== 'Declined'

/* Keeping an application for later is offered only on one nobody has decided.
   From the maybe list it would rewrite the same value, and from the declined
   list it would soften a refusal that was already given. */
export const isMaybeOffered = ({ view }: { view: LeadView }): boolean => view === 'Pending'

const COUNT_IN_VIEW: Readonly<Record<LeadView, (counts: LeadsReviewCounts) => number>> = {
  Pending: (counts) => counts.waitingCount,
  Maybe: (counts) => counts.maybeCount,
  Declined: (counts) => counts.declinedCount,
}

export const selectCountInView = ({
  counts,
  view,
}: {
  counts: LeadsReviewCounts
  view: LeadView
}): number => COUNT_IN_VIEW[view](counts)

/* Home and End as well as the arrows, because three chips make "the other one"
   an ambiguous instruction and a reviewer moving by keyboard should not have to
   count steps. Wrapping at both ends is what the tablist pattern specifies. */
const STEP_FOR_KEY: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
}

export const findViewForArrowKey = ({
  key,
  view,
}: {
  key: string
  view: LeadView
}): LeadView | undefined => {
  if (key === 'Home') {
    return LEAD_VIEWS[0]
  }
  if (key === 'End') {
    return LEAD_VIEWS[LEAD_VIEWS.length - 1]
  }
  const step = STEP_FOR_KEY[key]
  if (step === undefined) {
    return undefined
  }
  const currentIndex = LEAD_VIEWS.indexOf(view)
  const nextIndex = (currentIndex + step + LEAD_VIEWS.length) % LEAD_VIEWS.length
  return LEAD_VIEWS[nextIndex]
}

/* The chip's own id, so the list it opens can name the chip that opened it
   without the two components agreeing on a string separately. */
export const toViewChipId = ({ baseId, view }: { baseId: string; view: LeadView }): string =>
  `${baseId}-${view.toLowerCase()}`
