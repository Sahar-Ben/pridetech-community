import { ApplicationDecisionControls } from './ApplicationDecisionControls'
import type { ApprovalDecision, DeclineDecision } from './decision'
import type { ReviewableApplication } from './leadsReview'
import { PriorMemberNotice } from './PriorMemberNotice'
import type { LeadDecisionState } from './useLeadDecisions'
import { NoticeBanner } from '../../app/NoticeBanner'
import { DATA_PANEL_CLASSES } from '../../theme/surfaces'

const FIELD_SEPARATOR = ' \u{00b7} '

/* Opaque, not glass. This is the surface the organiser reads 256 times in a
   sitting, so its contrast is a fixed 17.7:1 rather than a function of where
   the card happens to fall on the gradient. */
const CARD_CLASSES = [
  DATA_PANEL_CLASSES,
  'flex flex-col gap-3 px-4 py-3.5',
  'transition-[opacity,transform,box-shadow] duration-200 ease-brand',
  'hover:shadow-lift',
].join(' ')

/* The card is on its way out of the queue and cannot be acted on again, and
   saying so with the same fade it will leave by costs no extra step. */
const SAVING_CLASSES = 'scale-[0.995] opacity-60'

const joinPresentFields = (fields: ReadonlyArray<string | undefined>): string =>
  fields.filter((field) => field !== undefined).join(FIELD_SEPARATOR)

type ApplicationCardProps = {
  application: ReviewableApplication
  decisionState: LeadDecisionState
  onApprove: (decision: ApprovalDecision) => void
  onDecline: ((decision: DeclineDecision) => void) | undefined
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
    <li className={`${CARD_CLASSES} ${decisionState.isSaving ? SAVING_CLASSES : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-bold text-ink">{applicantName}</h3>
          {roleLine !== '' && <p className="text-sm text-ink">{roleLine}</p>}
          {contextLine !== '' && <p className="text-xs text-ink-muted">{contextLine}</p>}
          <p className="text-xs text-ink-muted">
            {lead.linkedIn === undefined ? (
              <span className="font-semibold text-warning-ink">No LinkedIn</span>
            ) : (
              <a
                className="font-semibold text-accent underline underline-offset-2"
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
        <NoticeBanner role="alert" title={decisionState.errorMessage} tone="danger" />
      )}
    </li>
  )
}
