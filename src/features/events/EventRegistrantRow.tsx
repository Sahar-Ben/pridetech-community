import { EmptyValue } from '../members/EmptyValue'
import { RegistrantLinkNote } from './RegistrantLinkNote'
import { RegistrantStatusBadge } from './RegistrantStatusBadge'
import { deriveRegistrantStatus } from './eventAttendance'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { resolveRegistrantLink } from './registrantLink'
import { REGISTRANT_COLUMN_CLASSES } from './registrantColumns'

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
      <tr className="border-t border-hairline">
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name} wrap-anywhere`}>
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
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.email} wrap-anywhere`}>
          {registrant.email ?? <EmptyValue />}
        </td>
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.company} wrap-anywhere`}>
          {registrant.company ?? <EmptyValue />}
        </td>
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.link} text-xs`}>
          <RegistrantLinkNote link={link} />
        </td>
        <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.status}`}>
          <RegistrantStatusBadge status={status} />
        </td>
      </tr>
      {/* A line of its own under the person, across the whole table: the
          Community column is a fifth of a phone, too narrow for a button anybody
          could read. Only where there is an address to record: a row with no email
          has nothing to link by, and a guest is here as somebody's guest. */}
      {canLink && (
        <tr data-row="link">
          <td className="px-3 pb-3" colSpan={ALL_COLUMNS_SPAN}>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2">
              <span className="text-xs text-ink-muted">
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
