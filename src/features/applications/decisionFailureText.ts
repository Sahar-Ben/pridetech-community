import type { DecisionKind } from './decision'
import type { Lead } from './lead'
import { describeError } from '../../errors/describeError'
import { isForbiddenError } from '../../sheets/sheetsRequestError'

const VERBS: Readonly<Record<DecisionKind, string>> = {
  approve: 'Approving',
  decline: 'Declining',
}

/* A refusal is told apart from every other failure because its cure is specific
   and unguessable: the app holds a `drive.file` grant, which reaches only the
   files picked through the Google Picker, so retrying and signing in again both
   do nothing and only picking the spreadsheet again helps. */
const describeCause = (error: unknown): string => {
  if (isForbiddenError(error)) {
    return 'Google refused it: this app has no permission to change this spreadsheet. It is only granted the files you pick with the Google Picker, so use "Change spreadsheet" to pick this one again, then try the decision again.'
  }
  return describeError({ error, fallback: 'Google gave no detail.' })
}

export const describeDecisionFailure = ({
  decision,
  lead,
  error,
}: {
  decision: DecisionKind
  lead: Lead
  error: unknown
}): string => `${VERBS[decision]} ${lead.name ?? lead.email} failed. ${describeCause(error)}`
