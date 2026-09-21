import type { RegistrantStatus } from './eventAttendance'

const BADGE_CLASSES: Readonly<Record<RegistrantStatus, string>> = {
  registered: 'bg-neutral-surface text-neutral-ink ring-neutral-ink/25',
  attended: 'bg-arrived-surface text-arrived-ink ring-arrived-edge/40',
  waitlist: 'bg-surface-sunken text-ink ring-edge/40',
  'no-show': 'bg-warning-surface text-warning-ink ring-warning-edge/50',
}

const BASE_CLASSES = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset'

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
    className={`${BASE_CLASSES} ${BADGE_CLASSES[status]}`}
  >
    {BADGE_LABELS[status]}
  </span>
)
