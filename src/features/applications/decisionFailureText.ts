import type { DecisionKind } from './decision'
import type { Lead } from './lead'
import { describeSheetsFailureCause } from '../../sheets/sheetsFailureCause'

const VERBS: Readonly<Record<DecisionKind, string>> = {
  approve: 'Approving',
  decline: 'Declining',
}

export const describeDecisionFailure = ({
  decision,
  lead,
  error,
}: {
  decision: DecisionKind
  lead: Lead
  error: unknown
}): string => `${VERBS[decision]} ${lead.name ?? lead.email} failed. ${describeSheetsFailureCause(error)}`
