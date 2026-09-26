/* Approving is not here: an approval says yes, and nobody has ever had to
   explain a yes. These two are the decisions that end an application. */
export type ReasonedDecisionKind = 'decline' | 'maybe'

/* Two lists, not one. The reason somebody is turned away and the reason somebody
   is kept for later are different sentences about different people, and a single
   list would put "Not in Tech" in front of a reviewer who is keeping an
   applicant precisely because they are close. The declining three are the
   owner's own wording, kept verbatim so the column reads the way the sheet is
   filtered on. The keeping-for-later three are a first guess for the owner to
   correct. */
export const REASON_CHIPS = {
  decline: ['Not in Tech', 'Less than 3 years', 'In tech but not in the Industry'],
  maybe: ['Almost 3 years in tech', 'Needs a second opinion', 'Waiting on more details'],
} as const satisfies Record<ReasonedDecisionKind, readonly string[]>

const toReasonParts = (reason: string): readonly string[] =>
  reason
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

const joinReasonParts = (parts: readonly string[]): string => parts.join(', ')

/* Whitespace is not a reason. The dialog will not send one, and this is where
   that is decided, so the button that enables on a reason and the value that
   reaches the sheet cannot disagree about what counts. */
export const toDecisionReason = (text: string): string | undefined => {
  const trimmed = text.trim()
  return trimmed === '' ? undefined : trimmed
}

/* A chip reads as selected only when its text stands alone between the commas.
   Matching anywhere in the field would light up "Not in Tech" for a reviewer who
   wrote "Not in Tech yet", and clicking it then would take their words away. */
export const isReasonChipSelected = ({
  reason,
  chip,
}: {
  reason: string
  chip: string
}): boolean => toReasonParts(reason).includes(chip)

/* The chips fill the field rather than replacing it: whatever the reviewer typed
   is still there afterwards, and still editable. */
export const toggleReasonChip = ({ reason, chip }: { reason: string; chip: string }): string => {
  const parts = toReasonParts(reason)
  if (parts.includes(chip)) {
    return joinReasonParts(parts.filter((part) => part !== chip))
  }
  return joinReasonParts([...parts, chip])
}
