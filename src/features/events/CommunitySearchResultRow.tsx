import { MemberStatusBadge } from '../members/MemberStatusBadge'
import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../../theme/controls'
import { hasRegistrantArrived } from './registrant'
import type { CommunitySearchResult } from './communitySearch'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const ROW_CLASSES =
  'flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-hairline bg-surface px-4 py-3'

const ACTION_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const ALREADY_CLASSES = 'text-sm font-semibold text-ink-muted'

type CommunitySearchResultRowProps = {
  result: CommunitySearchResult
  onAdd: (member: Member) => void
  onCheckInExisting: (registrant: Registrant) => void
}

/* A member who is already on this event's list is never offered a second row:
   two rows for one person is the quiet mistake a door makes at speed, and it
   ends as an attendance figure nobody can reconcile afterwards. */
export const CommunitySearchResultRow = ({
  result,
  onAdd,
  onCheckInExisting,
}: CommunitySearchResultRowProps) => {
  const { member, existingRegistrant } = result

  return (
    <div className={ROW_CLASSES}>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-bold break-words text-ink">
          {member.name}
        </span>
        <span className="text-sm break-words text-ink-muted">{member.mail}</span>
        {member.status !== 'Active' && (
          <span>
            <MemberStatusBadge status={member.status} />
          </span>
        )}
      </span>

      {existingRegistrant === undefined && (
        <button className={ACTION_BUTTON_CLASSES} onClick={() => onAdd(member)} type="button">
          Add {member.name}
        </button>
      )}

      {existingRegistrant !== undefined && hasRegistrantArrived(existingRegistrant) && (
        <span className={ALREADY_CLASSES}>Already checked in</span>
      )}

      {existingRegistrant !== undefined && !hasRegistrantArrived(existingRegistrant) && (
        <span className="flex flex-wrap items-center gap-2">
          <span className={ALREADY_CLASSES}>Already on this list</span>
          <button
            className={ACTION_BUTTON_CLASSES}
            onClick={() => onCheckInExisting(existingRegistrant)}
            type="button"
          >
            Check in {member.name}
          </button>
        </span>
      )}
    </div>
  )
}
