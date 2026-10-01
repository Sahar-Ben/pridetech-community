import type { Lead } from './lead'
import { toLinkedInHref } from '../../app/linkedInUrl'

const LINK_CLASSES = [
  'flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] border border-card-strong-edge',
  'bg-surface px-2 text-[13px] font-medium text-ink no-underline',
  'transition-colors duration-150 ease-brand hover:bg-surface-raised',
].join(' ')

const MISSING_CLASSES = [
  'flex min-h-11 items-center justify-center rounded-[14px] border border-warning-edge',
  'bg-warning-surface px-2 text-[13px] font-semibold text-warning-ink',
].join(' ')

const ICON_PROPS = {
  'aria-hidden': true,
  fill: 'none',
  height: 16,
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
  width: 16,
} as const

/* `tel:` takes digits and a leading plus only; the sheet holds numbers typed
   by hand with spaces and dashes. */
const toTelHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`

type ApplicantContactLinksProps = {
  lead: Lead
}

/* LinkedIn first because gender is decided from the profile. A missing
   profile is said in the warning ink in the button's place rather than left
   out, since the reviewer cannot decide without one. A cell with text in it
   but no address to find says so differently, with what was typed on hover,
   because "no profile" would be untrue. */
export const ApplicantContactLinks = ({ lead }: ApplicantContactLinksProps) => {
  const linkedInHref = toLinkedInHref(lead.linkedIn)

  return (
    <div className="grid grid-cols-3 gap-2">
      {linkedInHref === undefined ? (
        lead.linkedIn === undefined ? (
          <span className={MISSING_CLASSES}>No LinkedIn</span>
        ) : (
          <span className={MISSING_CLASSES} title={lead.linkedIn}>
            Check LinkedIn
          </span>
        )
      ) : (
        <a className={LINK_CLASSES} href={linkedInHref} rel="noopener noreferrer" target="_blank">
          <svg {...ICON_PROPS}>
            <rect height="18" rx="4" width="18" x="3" y="3" />
            <path d="M8 10v7" />
            <path d="M8 7h.01" />
            <path d="M12 17v-4a2.5 2.5 0 0 1 5 0v4" />
            <path d="M12 10v7" />
          </svg>
          LinkedIn
        </a>
      )}
      <a className={LINK_CLASSES} href={`mailto:${lead.email}`}>
        <svg {...ICON_PROPS}>
          <rect height="14" rx="3" width="18" x="3" y="5" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        Email
      </a>
      {lead.phone !== undefined && (
        <a className={LINK_CLASSES} href={toTelHref(lead.phone)}>
          <svg {...ICON_PROPS}>
            <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
          </svg>
          Call
        </a>
      )}
    </div>
  )
}
