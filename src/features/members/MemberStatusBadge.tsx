import type { MemberStatus } from './member'

const BADGE_CLASSES: Readonly<Record<MemberStatus, string>> = {
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'Ex-member': 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

type MemberStatusBadgeProps = {
  status: MemberStatus
}

export const MemberStatusBadge = ({ status }: MemberStatusBadgeProps) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[status]}`}
  >
    {status}
  </span>
)
