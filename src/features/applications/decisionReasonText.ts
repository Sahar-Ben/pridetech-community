import type { ReasonedDecisionKind } from './decisionReason'

/* The applicant is named in the question because the dialog covers the card it
   was opened from: without the name, a reviewer coming back to the screen has no
   way to tell which of 256 applications they are about to decide. */
const ASK_FOR_REASON: Readonly<Record<ReasonedDecisionKind, (applicant: string) => string>> = {
  decline: (applicant) => `Why are you declining ${applicant}?`,
  maybe: (applicant) => `Why keep ${applicant} for later?`,
}

export const describeReasonPrompt = ({
  kind,
  applicantName,
}: {
  kind: ReasonedDecisionKind
  applicantName: string
}): string => ASK_FOR_REASON[kind](applicantName)
