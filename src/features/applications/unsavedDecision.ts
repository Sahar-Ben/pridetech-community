import type { Lead } from './lead'

export type DecisionKind = 'approve' | 'decline'

const VERBS: Readonly<Record<DecisionKind, string>> = {
  approve: 'Approving',
  decline: 'Declining',
}

export const describeUnsavedDecision = ({
  decision,
  lead,
}: {
  decision: DecisionKind
  lead: Lead
}): string => {
  const applicant = lead.name ?? lead.email
  return `${VERBS[decision]} ${applicant} was not written to the Google Sheet. Decisions are not connected yet, so this application is still untouched and still waiting.`
}
