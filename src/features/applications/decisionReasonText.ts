import type { ReasonedDecisionKind } from './decisionReason'

/* The applicant is named in the question because the dialog covers the card it
   was opened from: without the name, a reviewer coming back to the screen has no
   way to tell which of 256 applications they are about to decide. */
const ASK_FOR_REASON: Readonly<Record<ReasonedDecisionKind, (applicant: string) => string>> = {
  decline: (applicant) => `Why are you declining ${applicant}?`,
  maybe: (applicant) => `Why keep ${applicant} for later?`,
}

/* The two ways out of the dialog that take the decision, each saying which
   decision it takes. "Skip" and "Apply" read as "close this" and "save this",
   and a reviewer could not tell that the first one declined somebody. */
const DECISION_BUTTONS: Readonly<
  Record<ReasonedDecisionKind, { withoutReason: string; withReason: string }>
> = {
  decline: { withoutReason: 'Decline, no reason', withReason: 'Decline with reason' },
  maybe: { withoutReason: 'Keep, no reason', withReason: 'Keep with reason' },
}

export const describeDecisionButtons = (
  kind: ReasonedDecisionKind,
): { withoutReason: string; withReason: string } => DECISION_BUTTONS[kind]

export const describeReasonPrompt = ({
  kind,
  applicantName,
}: {
  kind: ReasonedDecisionKind
  applicantName: string
}): string => ASK_FOR_REASON[kind](applicantName)
