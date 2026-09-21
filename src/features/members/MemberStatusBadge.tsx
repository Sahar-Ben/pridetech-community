import type { MemberStatus } from './member'

const BADGE_CLASSES: Readonly<Record<MemberStatus, string>> = {
  Active: 'bg-success-surface text-success-ink ring-success-edge/40',
  'Ex-member': 'bg-neutral-surface text-neutral-ink ring-neutral-ink/25',
}

const BASE_CLASSES = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset'

type MemberStatusBadgeProps = {
  status: MemberStatus
}

export const MemberStatusBadge = ({ status }: MemberStatusBadgeProps) => (
  <span className={`${BASE_CLASSES} ${BADGE_CLASSES[status]}`}>{status}</span>
)
