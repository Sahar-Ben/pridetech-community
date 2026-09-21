import { EmptyValue } from '../members/EmptyValue'
import { RegistrantLinkNote } from './RegistrantLinkNote'
import { RegistrantStatusBadge } from './RegistrantStatusBadge'
import { deriveRegistrantStatus } from './eventAttendance'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { resolveRegistrantLink } from './registrantLink'
import { REGISTRANT_COLUMN_CLASSES } from './registrantColumns'

const CELL_CLASSES = 'px-2 py-2 align-top text-slate-700 dark:text-slate-300'

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
    <tr className="border-t border-slate-200 dark:border-slate-800">
      <td className={`${CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name} break-words`}>
        <span className="font-medium text-slate-900 dark:text-slate-100">{registrant.name}</span>
        {registrant.isWalkIn && (
          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">(walk-in)</span>
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
