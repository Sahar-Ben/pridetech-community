import { EventRegistrantRow } from './EventRegistrantRow'
import { REGISTRANT_COLUMN_CLASSES } from './registrantColumns'
import { sortRegistrantsByName } from './eventRegistrants'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const HEADER_CELL_CLASSES =
  'px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400'

const WRAPPER_CLASSES =
  'rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

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
      <thead className="bg-slate-100 dark:bg-slate-800">
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
