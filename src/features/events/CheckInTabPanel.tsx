import { CheckInEmptyStateNote } from './CheckInEmptyStateNote'
import { CheckInList } from './CheckInList'
import type { CheckInBoard, CheckInTab } from './checkInBoard'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { RefObject } from 'react'

const LIST_LABELS: Readonly<Record<CheckInTab, string>> = {
  pending: 'People still to arrive',
  arrived: 'People already in',
}

type CheckInTabPanelProps = {
  panelId: string
  labelledBy: string
  panelRef: RefObject<HTMLDivElement | null>
  activeTab: CheckInTab
  board: CheckInBoard
  members: readonly Member[]
  eventRegistrants: readonly Registrant[]
  onToggle: (registrantId: string) => void
  onShowOtherTab: () => void
}

/* `tabIndex={-1}` rather than `0`: the panel holds its own buttons, so it never
   needs a stop in the tab order, but switching tabs from the search hint has to
   be able to put focus somewhere that survives the switch. */
export const CheckInTabPanel = ({
  panelId,
  labelledBy,
  panelRef,
  activeTab,
  board,
  members,
  eventRegistrants,
  onToggle,
  onShowOtherTab,
}: CheckInTabPanelProps) => (
  <div aria-labelledby={labelledBy} id={panelId} ref={panelRef} role="tabpanel" tabIndex={-1}>
    {board.emptyState === undefined ? (
      <CheckInList
        eventRegistrants={eventRegistrants}
        listLabel={LIST_LABELS[activeTab]}
        members={members}
        onToggle={onToggle}
        visibleRegistrants={board.visibleRegistrants}
      />
    ) : (
      <CheckInEmptyStateNote
        activeTab={activeTab}
        emptyState={board.emptyState}
        onShowOtherTab={onShowOtherTab}
      />
    )}
  </div>
)
