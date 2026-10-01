import { ApplicationDecisionControls } from './ApplicationDecisionControls'
import type { ApprovalDecision, DeclineDecision, MaybeDecision } from './decision'
import type { ReviewableApplication } from './leadsReview'
import { PriorMemberNotice } from './PriorMemberNotice'
import type { LeadDecisionState } from './useLeadDecisions'
import { NoticeBanner } from '../../app/NoticeBanner'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const FIELD_SEPARATOR = ' \u{00b7} '

/* The surface the organiser reads 256 times in a sitting: one flat card, the
   applicant on top, the decision underneath at thumb size. */
const CARD_CLASSES = [
  WORK_PANEL_CLASSES,
  'flex flex-col gap-3.5 rounded-[var(--radius-brand)] p-[18px]',
  'transition-[opacity,transform,box-shadow] duration-200 ease-brand',
  'hover:shadow-lift',
].join(' ')

/* The card is on its way out of the queue and cannot be acted on again, and
   saying so with the same fade it will leave by costs no extra step. */
const SAVING_CLASSES = 'scale-[0.995] opacity-60'

const AVATAR_CLASSES = [
  'flex size-[46px] shrink-0 items-center justify-center rounded-[15px] border border-card-strong-edge',
  'bg-nav-active font-mono text-sm font-bold text-chart-1',
].join(' ')

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

const joinPresentFields = (fields: ReadonlyArray<string | undefined>): string =>
  fields.filter((field) => field !== undefined).join(FIELD_SEPARATOR)

type ApplicationCardProps = {
  application: ReviewableApplication
  decisionState: LeadDecisionState
  onApprove: (decision: ApprovalDecision) => void
  decisions: {
    onDecline: ((decision: DeclineDecision) => Promise<void>) | undefined
    onMarkMaybe: ((decision: MaybeDecision) => Promise<void>) | undefined
  }
}

export const ApplicationCard = ({
  application,
  decisionState,
  onApprove,
  decisions,
}: ApplicationCardProps) => {
  const { lead, priorMember } = application
  const isNamedByEmail = lead.name === undefined
  const applicantName = lead.name ?? lead.email
  const roleLine = joinPresentFields([lead.jobTitle, lead.company])
  const contextLine = joinPresentFields([lead.city, lead.interests])
  const contactLine = joinPresentFields([isNamedByEmail ? undefined : lead.email, lead.phone])

  return (
    <li className={`${CARD_CLASSES} ${decisionState.isSaving ? SAVING_CLASSES : ''}`}>
      <div className="flex flex-col gap-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className={AVATAR_CLASSES}>
            {initialsOf(applicantName)}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] break-words text-ink">
              {applicantName}
            </h3>
            {roleLine !== '' && <p className="text-[13px] text-ink-muted">{roleLine}</p>}
            {contextLine !== '' && <p className="text-xs text-ink-faint">{contextLine}</p>}
            <p className="text-xs text-ink-muted">
              {lead.linkedIn === undefined ? (
                <span className="font-semibold text-warning-on-panel">No LinkedIn</span>
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
        </div>

        <ApplicationDecisionControls
          lead={lead}
          isSaving={decisionState.isSaving}
          onApprove={onApprove}
          decisions={decisions}
        />
      </div>

      {priorMember !== undefined && <PriorMemberNotice priorMember={priorMember} />}

      {decisionState.errorMessage !== undefined && (
        <NoticeBanner role="alert" title={decisionState.errorMessage} tone="danger" />
      )}
    </li>
  )
}
