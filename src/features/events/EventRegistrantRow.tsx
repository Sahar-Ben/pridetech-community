import { EmptyValue } from '../members/EmptyValue'
import { RegistrantLinkNote } from './RegistrantLinkNote'
import { RegistrantStatusBadge } from './RegistrantStatusBadge'
import { deriveRegistrantStatus } from './eventAttendance'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { resolveRegistrantLink } from './registrantLink'
import { REGISTRANT_COLUMN_CLASSES } from './registrantColumns'

const CELL_CLASSES = 'px-3 py-2.5 align-top text-ink'

type EventRegistrantRowProps = {
  registrant: Registrant
  members: readonly Member[]
  eventRegistrants: readonly Registrant[]
  isClosedOut: boolean
}

export const EventRegistrantRow = ({
  registrant,
  members,
  eventRegistrants,
  isClosedOut,
}: EventRegistrantRowProps) => {
  const link = resolveRegistrantLink({ registrant, members, eventRegistrants })
  const status = deriveRegistrantStatus({ registrant, isClosedOut })

  return (
    <tr className="border-t border-hairline">
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name} break-words`}>
        <span className="font-semibold text-ink">{registrant.name}</span>
        {registrant.isWalkIn && (
          <span className="ml-1 text-xs text-ink-muted">(walk-in)</span>
        )}
      </td>
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.email} break-words`}>
        {registrant.email ?? <EmptyValue />}
      </td>
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.company} break-words`}>
        {registrant.company ?? <EmptyValue />}
      </td>
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.link} text-xs`}>
        <RegistrantLinkNote link={link} />
      </td>
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.status}`}>
        <RegistrantStatusBadge status={status} />
      </td>
    </tr>
  )
}
