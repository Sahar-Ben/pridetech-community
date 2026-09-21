import { ApplicationDecisionControls } from './ApplicationDecisionControls'
import type { ApprovalDecision, DeclineDecision } from './decision'
import type { WaitingApplication } from './leadsReview'
import { PriorMemberNotice } from './PriorMemberNotice'
import type { LeadDecisionState } from './useLeadDecisions'

const FIELD_SEPARATOR = ' \u{00b7} '

const joinPresentFields = (fields: ReadonlyArray<string | undefined>): string =>
  fields.filter((field) => field !== undefined).join(FIELD_SEPARATOR)

type ApplicationCardProps = {
  application: WaitingApplication
  decisionState: LeadDecisionState
  onApprove: (decision: ApprovalDecision) => void
  onDecline: (decision: DeclineDecision) => void
}

export const ApplicationCard = ({
  application,
  decisionState,
  onApprove,
  onDecline,
}: ApplicationCardProps) => {
  const { lead, priorMember } = application
  const isNamedByEmail = lead.name === undefined
  const applicantName = lead.name ?? lead.email
  const roleLine = joinPresentFields([lead.jobTitle, lead.company])
  const contextLine = joinPresentFields([lead.city, lead.interests])
  const contactLine = joinPresentFields([isNamedByEmail ? undefined : lead.email, lead.phone])

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {applicantName}
          </h3>
          {roleLine !== '' && (
            <p className="text-sm text-slate-700 dark:text-slate-300">{roleLine}</p>
          )}
          {contextLine !== '' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{contextLine}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lead.linkedIn === undefined ? (
              <span className="font-medium text-amber-700 dark:text-amber-500">No LinkedIn</span>
            ) : (
              <a
                className="font-medium text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                href={lead.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
            {contactLine !== '' && (
              <span>
                {FIELD_SEPARATOR}
                {contactLine}
              </span>
            )}
          </p>
        </div>

        <ApplicationDecisionControls
          lead={lead}
          isSaving={decisionState.isSaving}
          onApprove={onApprove}
          onDecline={onDecline}
        />
      </div>

      {priorMember !== undefined && <PriorMemberNotice priorMember={priorMember} />}

      {decisionState.errorMessage !== undefined && (
        <p
          className="rounded-md border-2 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200"
          role="alert"
        >
          {decisionState.errorMessage}
        </p>
      )}
    </li>
  )
}
