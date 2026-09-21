import {
  MEMBER_STATUSES,
  REMOVAL_REASONS,
  type MemberGender,
  type MemberStatus,
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

const LISTED_REMOVAL_REASONS: ReadonlyArray<SelectOption<string>> = [
  { value: '', label: NOT_RECORDED_LABEL },
  ...REMOVAL_REASONS.map((reason) => ({ value: reason, label: reason })),
]

/* A reason somebody typed into the sheet by hand is offered back alongside the
   list. Without it the select would silently show the first option instead, and
   saving would replace a recorded reason with one nobody chose. */
export const buildRemovalReasonOptions = (
  recordedReason: string | undefined,
): ReadonlyArray<SelectOption<string>> => {
  if (
    recordedReason === undefined ||
    LISTED_REMOVAL_REASONS.some((option) => option.value === recordedReason)
  ) {
    return LISTED_REMOVAL_REASONS
  }
  return [...LISTED_REMOVAL_REASONS, { value: recordedReason, label: recordedReason }]
}
