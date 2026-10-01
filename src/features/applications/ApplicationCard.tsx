import { ApplicantContactLinks } from './ApplicantContactLinks'
import { summariseInterests } from './applicantTags'
import { ApplicationDecisionControls } from './ApplicationDecisionControls'
import type { ApprovalDecision, DeclineDecision, MaybeDecision } from './decision'
import type { ReviewableApplication } from './leadsReview'
import { PriorMemberNotice } from './PriorMemberNotice'
import type { LeadDecisionState } from './useLeadDecisions'
import { CopyableValue } from '../../app/CopyableValue'
import { initialsOf } from '../../app/initials'
import { NoticeBanner } from '../../app/NoticeBanner'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

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

const CHIP_CLASSES =
  'shrink-0 rounded-full border border-card-strong-edge bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap text-neutral-ink'

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
  const roleLine = [lead.jobTitle, lead.company].filter((field) => field !== undefined).join(' · ')
  const interests = summariseInterests(lead.interests)

  return (
    <li className={`${CARD_CLASSES} ${decisionState.isSaving ? SAVING_CLASSES : ''}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={AVATAR_CLASSES}>
          {initialsOf(applicantName)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] wrap-anywhere text-ink">
            {applicantName}
          </h3>
          {roleLine !== '' && <p className="text-[13px] text-ink-muted">{roleLine}</p>}
        </div>
      </div>

      {(lead.city !== undefined || interests.shown.length > 0) && (
        /* One line that scrolls sideways on a phone, so a long list of
           interests costs no height on a card read 255 times; it wraps from
           `sm` up, where there is room. */
        <ul
          aria-label="City and interests"
          className="-mx-[18px] flex gap-1.5 overflow-x-auto px-[18px] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {lead.city !== undefined && <li className={`${CHIP_CLASSES} text-ink`}>{lead.city}</li>}
          {interests.shown.map((interest) => (
            <li className={CHIP_CLASSES} key={interest}>
              {interest}
            </li>
          ))}
          {interests.hiddenCount > 0 && (
            <li className={CHIP_CLASSES}>
              <span aria-hidden="true">+{interests.hiddenCount}</span>
              <span className="sr-only">and {interests.hiddenCount} more</span>
            </li>
          )}
        </ul>
      )}

      {/* The address is the key every duplicate and prior-member match is made
          on, and both are what an organiser pastes into a message: each sits
          on its own line with a copy button. */}
      <div className="flex flex-col gap-1.5">
        {!isNamedByEmail && <CopyableValue label="email" value={lead.email} />}
        {lead.phone !== undefined && <CopyableValue label="phone" value={lead.phone} />}
      </div>

      <ApplicantContactLinks lead={lead} />

      <ApplicationDecisionControls
        lead={lead}
        isSaving={decisionState.isSaving}
        onApprove={onApprove}
        decisions={decisions}
      />

      {priorMember !== undefined && <PriorMemberNotice priorMember={priorMember} />}

      {decisionState.errorMessage !== undefined && (
        <NoticeBanner role="alert" title={decisionState.errorMessage} tone="danger" />
      )}
    </li>
  )
}
