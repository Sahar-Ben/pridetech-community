import { EmptyValue } from '../members/EmptyValue'
import { RegistrantLinkNote } from './RegistrantLinkNote'
import { RegistrantStatusBadge } from './RegistrantStatusBadge'
import { deriveRegistrantStatus } from './eventAttendance'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { resolveRegistrantLink } from './registrantLink'
import {
  REGISTRANT_CARD_PLACEMENT,
  REGISTRANT_COLUMN_CLASSES,
  REGISTRANT_ROW_CLASSES,
} from './registrantColumns'

import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const CELL_CLASSES = 'px-3 py-2.5 align-top text-ink'

const LINK_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} min-h-11 shrink-0`

/* Every column there is, hidden or not: a span longer than the visible row is
   clipped to it, and a shorter one would leave the last cells empty. */
const ALL_COLUMNS_SPAN = 5

type EventRegistrantRowProps = {
  registrant: Registrant
  members: readonly Member[]
  eventRegistrants: readonly Registrant[]
  isClosedOut: boolean
  onLinkToMember: (registrant: Registrant & { email: string }) => void
}

export const EventRegistrantRow = ({
  registrant,
  members,
  eventRegistrants,
  isClosedOut,
  onLinkToMember,
}: EventRegistrantRowProps) => {
  const link = resolveRegistrantLink({ registrant, members, eventRegistrants })
  const { email } = registrant
  const status = deriveRegistrantStatus({ registrant, isClosedOut })

  const canLink = link.kind === 'unmatched' && email !== undefined

  return (
    <>
      <tr className={REGISTRANT_ROW_CLASSES} role="row">
        <td
          className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name} ${REGISTRANT_CARD_PLACEMENT.name} wrap-anywhere`}
          role="cell"
        >
          <span className="font-semibold text-ink">{registrant.name}</span>
          {registrant.isWalkIn && (
            <span className="ml-1 text-xs text-ink-muted">(walk-in)</span>
          )}
          {registrant.attendeeType !== undefined && (
            <span className="mt-1 block text-xs font-semibold text-ink-muted">
              {registrant.attendeeType}
            </span>
          )}
        </td>
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.email} wrap-anywhere`} role="cell">
          {registrant.email ?? <EmptyValue />}
        </td>
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.company} wrap-anywhere`} role="cell">
          {registrant.company ?? <EmptyValue />}
        </td>
        <td
          className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.link} ${REGISTRANT_CARD_PLACEMENT.link} text-xs`}
          role="cell"
        >
          <RegistrantLinkNote link={link} />
        </td>
        <td
          className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.status} ${REGISTRANT_CARD_PLACEMENT.status}`}
          role="cell"
        >
          <RegistrantStatusBadge status={status} />
        </td>
      </tr>
      {/* A line of its own under the person, across the whole table: the
          Community column is a fifth of a phone, too narrow for a button anybody
          could read. Only where there is an address to record: a row with no email
          has nothing to link by, and a guest is here as somebody's guest. */}
      {canLink && (
        <tr className="block sm:table-row" data-row="link" role="row">
          <td className="block px-3 pb-3 sm:table-cell" colSpan={ALL_COLUMNS_SPAN} role="cell">
            {/* On a phone the button alone, straight under "Not matched": with
                many unmatched people a boxed question on every card is most of
                the screen. The wider layout has room to say what it is for. */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:rounded-xl sm:bg-surface-raised sm:px-3 sm:py-2">
              <span className="text-xs text-ink-muted max-sm:hidden">
                A member who registered with another email?
              </span>
              <button
                aria-label={`Link ${registrant.name} to a member`}
                className={LINK_BUTTON_CLASSES}
                onClick={() => onLinkToMember({ ...registrant, email })}
                type="button"
              >
                Link to member
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
