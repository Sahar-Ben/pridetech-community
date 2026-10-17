import { EventRegistrantRow } from './EventRegistrantRow'
import {
  REGISTRANT_BODY_CLASSES,
  REGISTRANT_COLUMN_CLASSES,
  REGISTRANT_HEAD_CLASSES,
  REGISTRANT_TABLE_CLASSES,
} from './registrantColumns'
import { sortRegistrantsByName } from './eventRegistrants'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const HEADER_CELL_CLASSES =
  'px-3 py-2.5 text-left font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase'

/* Nested inside the event detail panel, so it borrows that panel's surface
   rather than stacking a second shadow on top of it. */
const WRAPPER_CLASSES = 'rounded-xl border border-hairline bg-surface'

type EventRegistrantsTableProps = {
  registrants: readonly Registrant[]
  /* Everybody on the event, which `registrants` may be a filtered part of: who
     a guest came with is looked up across the whole event. */
  eventRegistrants: readonly Registrant[]
  members: readonly Member[]
  isClosedOut: boolean
  onLinkToMember: (registrant: Registrant & { email: string }) => void
}

export const EventRegistrantsTable = ({
  registrants,
  eventRegistrants,
  members,
  isClosedOut,
  onLinkToMember,
}: EventRegistrantsTableProps) => (
  <div className={WRAPPER_CLASSES}>
    <table aria-label="Registrants" className={REGISTRANT_TABLE_CLASSES} role="table">
      <thead className={REGISTRANT_HEAD_CLASSES} role="rowgroup">
        <tr role="row">
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.name}`} role="columnheader" scope="col">
            Name
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.email}`} role="columnheader" scope="col">
            Email
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.company}`} role="columnheader" scope="col">
            Company
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.link}`} role="columnheader" scope="col">
            Community
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${REGISTRANT_COLUMN_CLASSES.status}`} role="columnheader" scope="col">
            Status
          </th>
        </tr>
      </thead>
      <tbody className={REGISTRANT_BODY_CLASSES} role="rowgroup">
        {sortRegistrantsByName(registrants).map((registrant) => (
          <EventRegistrantRow
            eventRegistrants={eventRegistrants}
            isClosedOut={isClosedOut}
            key={registrant.id}
            members={members}
            onLinkToMember={onLinkToMember}
            registrant={registrant}
          />
        ))}
      </tbody>
    </table>
  </div>
)
