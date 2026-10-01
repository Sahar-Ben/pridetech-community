import type { MemberStatus } from './member'

const PILL_CLASSES: Readonly<Record<MemberStatus, string>> = {
  Active: 'bg-success-surface text-success-ink ring-success-edge',
  'Ex-member': 'bg-neutral-surface text-neutral-ink ring-card-strong-edge',
}

/* Written out per breakpoint rather than built from the pill classes: Tailwind
   only emits a class it can read whole in the source. */
const LIST_PILL_CLASSES: Readonly<Record<MemberStatus, string>> = {
  Active: 'sm:bg-success-surface sm:text-success-ink sm:ring-success-edge',
  'Ex-member': 'sm:bg-neutral-surface sm:text-neutral-ink sm:ring-card-strong-edge',
}

const DOT_CLASSES: Readonly<Record<MemberStatus, string>> = {
  Active: 'bg-success-ink',
  'Ex-member': 'bg-ink-faint',
}

const PILL_BASE_CLASSES =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'

const LIST_BASE_CLASSES =
  'inline-flex items-center rounded-full text-xs font-semibold sm:px-2.5 sm:py-0.5 sm:ring-1 sm:ring-inset'

type MemberStatusBadgeProps = {
  status: MemberStatus
  compact?: boolean
}

/* `compact` is the list's version: a dot on a phone, as the design draws the
   rows, and the labelled pill from `sm` up. The word is always in the DOM --
   on a phone it is read out rather than shown. */
export const MemberStatusBadge = ({ status, compact = false }: MemberStatusBadgeProps) =>
  compact ? (
    <span className={`${LIST_BASE_CLASSES} ${LIST_PILL_CLASSES[status]}`}>
      <span aria-hidden="true" className={`size-2 rounded-full sm:hidden ${DOT_CLASSES[status]}`} />
      <span className="max-sm:sr-only">{status}</span>
    </span>
  ) : (
    <span className={`${PILL_BASE_CLASSES} ${PILL_CLASSES[status]}`}>{status}</span>
  )
