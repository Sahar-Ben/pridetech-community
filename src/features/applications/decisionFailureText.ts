import type { DecisionKind } from './decision'
import type { Lead } from './lead'
import { describeSheetsFailureCause } from '../../sheets/sheetsFailureCause'

/* A phrase rather than a verb, because one of the three wraps the applicant's
   name rather than preceding it. */
const DESCRIBE_ATTEMPT: Readonly<Record<DecisionKind, (applicant: string) => string>> = {
  approve: (applicant) => `Approving ${applicant}`,
  decline: (applicant) => `Declining ${applicant}`,
  maybe: (applicant) => `Keeping ${applicant} for later`,
}

export const describeDecisionFailure = ({
  decision,
  lead,
  error,
}: {
  decision: DecisionKind
  lead: Lead
  error: unknown
}): string =>
  `${DESCRIBE_ATTEMPT[decision](lead.name ?? lead.email)} failed. ${describeSheetsFailureCause(error)}`
