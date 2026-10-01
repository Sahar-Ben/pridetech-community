import { toLinkedInHref } from './linkedInUrl'
import { toTelHref, toWhatsAppHref } from './phoneLinks'

export type QuickAction = 'linkedin' | 'whatsapp' | 'call' | 'email'

const ACTION_CLASSES = [
  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-card-strong-edge',
  'bg-surface px-1 py-2 text-[12px] font-medium text-ink no-underline',
  'transition-colors duration-150 ease-brand hover:bg-surface-raised',
].join(' ')

const MISSING_CLASSES = [
  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed',
  'border-card-strong-edge px-1 py-2 text-center text-[12px] text-ink-faint',
].join(' ')

const WARNING_CLASSES = [
  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-warning-edge',
  'bg-warning-surface px-1 py-2 text-center text-[12px] font-semibold text-warning-ink',
].join(' ')

const Icon = ({ action }: { action: QuickAction }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="20"
  >
    {action === 'linkedin' && (
      <>
        <rect height="18" rx="4" width="18" x="3" y="3" />
        <path d="M8 10v7" />
        <path d="M8 7h.01" />
        <path d="M12 17v-4a2.5 2.5 0 0 1 5 0v4" />
        <path d="M12 10v7" />
      </>
    )}
    {action === 'whatsapp' && (
      <>
        <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />
        <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z" />
      </>
    )}
    {action === 'call' && (
      <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
    )}
    {action === 'email' && (
      <>
        <rect height="14" rx="3" width="18" x="3" y="5" />
        <path d="M3 7l9 6 9-6" />
      </>
    )}
  </svg>
)

const LABELS: Readonly<Record<QuickAction, string>> = {
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  call: 'Call',
  email: 'Email',
}

type QuickActionsProps = {
  actions: readonly QuickAction[]
  linkedIn: string | undefined
  phone: string | undefined
  email: string | undefined
}

/* One row of big buttons to reach a person: open their profile, message them
   on WhatsApp, call, write. Every cell is turned into a working address first
   (see linkedInUrl and phoneLinks); a missing one keeps its place as a quiet
   dashed tile, so the buttons never shift between people. A LinkedIn cell with
   text but no address says so in the warning ink -- gender is decided from the
   profile, and "no profile" would be untrue. */
export const QuickActions = ({ actions, linkedIn, phone, email }: QuickActionsProps) => {
  const hrefs: Readonly<Record<QuickAction, string | undefined>> = {
    linkedin: toLinkedInHref(linkedIn),
    whatsapp: toWhatsAppHref(phone),
    call: toTelHref(phone),
    email: email === undefined || email === '' ? undefined : `mailto:${email}`,
  }

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
    >
      {actions.map((action) => {
        const href = hrefs[action]
        if (href === undefined) {
          if (action === 'linkedin' && linkedIn !== undefined && linkedIn.trim() !== '') {
            return (
              <span className={WARNING_CLASSES} key={action} title={linkedIn}>
                <Icon action={action} />
                Check LinkedIn
              </span>
            )
          }
          return (
            <span className={MISSING_CLASSES} key={action}>
              <Icon action={action} />
              {action === 'linkedin'
                ? 'No LinkedIn'
                : `No ${action === 'email' ? 'email' : 'phone'}`}
            </span>
          )
        }
        const opensElsewhere = href.startsWith('https://')
        return (
          <a
            className={ACTION_CLASSES}
            href={href}
            key={action}
            rel={opensElsewhere ? 'noopener noreferrer' : undefined}
            target={opensElsewhere ? '_blank' : undefined}
          >
            <Icon action={action} />
            {LABELS[action]}
          </a>
        )
      })}
    </div>
  )
}
