import type { RegistrantStatus } from './eventAttendance'

const BADGE_CLASSES: Readonly<Record<RegistrantStatus, string>> = {
  registered: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  attended: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  waitlist: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  'no-show': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
}

const BADGE_LABELS: Readonly<Record<RegistrantStatus, string>> = {
  registered: 'Registered',
  attended: 'Attended',
  waitlist: 'Waitlist',
  'no-show': 'No-show',
}

type RegistrantStatusBadgeProps = {
  status: RegistrantStatus
}

export const RegistrantStatusBadge = ({ status }: RegistrantStatusBadgeProps) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[status]}`}
  >
    {BADGE_LABELS[status]}
  </span>
)
