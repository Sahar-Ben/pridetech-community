import { useState } from 'react'
import { CommunityWalkInSearch } from './CommunityWalkInSearch'
import { FormCheckboxField } from './FormCheckboxField'
import { MembersOnlyWarning } from './MembersOnlyWarning'
import { WalkInForm } from './WalkInForm'
import { SECONDARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from './eventButtonStyles'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { WalkInFields } from './walkInValidation'

const PANEL_CLASSES =
  'flex flex-col gap-3 rounded-lg border border-slate-300 px-4 py-3 dark:border-slate-700'

const CANCEL_BUTTON_CLASSES = `self-start ${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const PANEL_TITLE = 'Add someone not on the list'

type WalkInPanelProps = {
  isMembersOnly: boolean
  members: readonly Member[]
  registrants: readonly Registrant[]
  onAddMember: (member: Member) => void
  onAddNonMember: (fields: WalkInFields) => void
  onCheckInExisting: (registrant: Registrant) => void
  onCancel: () => void
}

/* Searching the community is the default because it is the common case: a
   member who never filled the form in. Typing a name by hand is the rare one,
   and it is the one that needs the policy said out loud. */
export const WalkInPanel = ({
  isMembersOnly,
  members,
  registrants,
  onAddMember,
  onAddNonMember,
  onCheckInExisting,
  onCancel,
}: WalkInPanelProps) => {
  const [isNonMemberEntry, setIsNonMemberEntry] = useState(false)

  return (
    <section aria-label={PANEL_TITLE} className={PANEL_CLASSES}>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{PANEL_TITLE}</h4>

      <FormCheckboxField
        hint="Almost everybody at the door is a member. Tick this only for somebody the community list does not know."
        isChecked={isNonMemberEntry}
        label="Not a PrideTech member"
        onChange={setIsNonMemberEntry}
      />

      {isNonMemberEntry ? (
        <>
          {isMembersOnly && <MembersOnlyWarning />}
          <WalkInForm onAdd={onAddNonMember} />
        </>
      ) : (
        <CommunityWalkInSearch
          members={members}
          onAdd={onAddMember}
          onCheckInExisting={onCheckInExisting}
          registrants={registrants}
        />
      )}

      <button className={CANCEL_BUTTON_CLASSES} onClick={onCancel} type="button">
        Cancel
      </button>
    </section>
  )
}
