import {
  MEMBER_STATUSES,
  REMOVAL_REASONS,
  type MemberGender,
  type MemberStatus,
  type RemovalReason,
} from './member'

export type SelectOption<TValue extends string> = {
  value: TValue
  label: string
}

const NOT_RECORDED_LABEL = 'Not recorded'

export const GENDER_OPTIONS: ReadonlyArray<SelectOption<MemberGender | ''>> = [
  { value: '', label: NOT_RECORDED_LABEL },
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
]

export const STATUS_OPTIONS: ReadonlyArray<SelectOption<MemberStatus>> = MEMBER_STATUSES.map(
  (status) => ({ value: status, label: status }),
)

export const REMOVAL_REASON_OPTIONS: ReadonlyArray<SelectOption<RemovalReason | ''>> = [
  { value: '', label: NOT_RECORDED_LABEL },
  ...REMOVAL_REASONS.map((reason) => ({ value: reason, label: reason })),
]
