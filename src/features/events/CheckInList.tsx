import { CheckInPersonButton } from './CheckInPersonButton'
import { describeNonMemberMarker } from './registrantLinkText'
import { resolveRegistrantLink } from './registrantLink'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

type CheckInListProps = {
  listLabel: string
  visibleRegistrants: readonly Registrant[]
  eventRegistrants: readonly Registrant[]
  members: readonly Member[]
  /* Undefined while the earlier events are still being read: no badge then,
     rather than one on everybody that goes out a moment later. */
  firstTimerIds: ReadonlySet<string> | undefined
  onToggle: (registrantId: string) => void
}

export const CheckInList = ({
  listLabel,
  visibleRegistrants,
  eventRegistrants,
  members,
  firstTimerIds,
  onToggle,
}: CheckInListProps) => (
  <ul aria-label={listLabel} className="flex flex-col gap-2">
    {visibleRegistrants.map((registrant) => (
      <li key={registrant.id}>
        <CheckInPersonButton
          memberMarker={describeNonMemberMarker(
            resolveRegistrantLink({ registrant, members, eventRegistrants }),
          )}
          isFirstEvent={firstTimerIds?.has(registrant.id) ?? false}
          onToggle={onToggle}
          registrant={registrant}
        />
      </li>
    ))}
  </ul>
)
