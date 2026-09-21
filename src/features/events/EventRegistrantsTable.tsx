import { EventRegistrantRow } from './EventRegistrantRow'
import { REGISTRANT_COLUMN_CLASSES } from './registrantColumns'
import { sortRegistrantsByName } from './eventRegistrants'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const HEADER_CELL_CLASSES =
  'px-3 py-2.5 text-left text-xs font-bold tracking-wide text-ink-muted uppercase'

/* Nested inside the event detail panel, so it borrows that panel's surface
   rather than stacking a second shadow on top of it. */
const WRAPPER_CLASSES = 'rounded-xl border border-hairline bg-surface'

type EventRegistrantsTableProps = {
  registrants: readonly Registrant[]
  members: readonly Member[]
  isClosedOut: boolean
}

export const EventRegistrantsTable = ({
  registrants,
  members,
  isClosedOut,
}: EventRegistrantsTableProps) => (
  <div className={WRAPPER_CLASSES}>
    <table aria-label="Registrants" className="w-full table-fixed text-sm">
      <thead className="bg-surface-raised">
        <tr>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name}`} scope="col">
            Name
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.email}`} scope="col">
            Email
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.company}`} scope="col">
            Company
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.link}`} scope="col">
            Community
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.status}`} scope="col">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {sortRegistrantsByName(registrants).map((registrant) => (
          <EventRegistrantRow
            eventRegistrants={registrants}
            isClosedOut={isClosedOut}
            key={registrant.id}
            members={members}
            registrant={registrant}
          />
        ))}
      </tbody>
    </table>
  </div>
)
