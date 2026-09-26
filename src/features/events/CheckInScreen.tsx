import { useEffect, useId, useRef, useState } from 'react'
import { AttendanceSaveStatus, type AttendanceSaveState } from './AttendanceSaveStatus'
import { CheckInCounter } from './CheckInCounter'
import { CheckInTabPanel } from './CheckInTabPanel'
import { CheckInTabs } from './CheckInTabs'
import { DoorSearchField } from './DoorSearchField'
import { WalkInPanel } from './WalkInPanel'
import { buildCheckInBoard, otherCheckInTab, toTabButtonId, type CheckInTab } from './checkInBoard'
import { describeCheckInToggle, describeWalkInAdded } from './checkInActionText'
import { toWalkInFieldsFromMember } from './checkIn'
import { DOOR_CONTROLS_CLASSES, DOOR_SHEET_CLASSES } from './checkInDoorStyles'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../../theme/controls'
import { summariseEventAttendance } from './eventAttendance'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { WalkInFields } from './walkInValidation'

const BACK_ARROW = '\u{2190}'

const WALK_IN_BUTTON_CLASSES = `w-full ${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const BACK_BUTTON_CLASSES = `self-start ${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

/* Often enough that a person checked in on the other phone at the door shows
   here before they could be tapped twice, and rarely enough to leave plenty of
   Google's per-minute allowance for the taps themselves. */
const REFRESH_INTERVAL_MS = 30_000

type CheckInScreenProps = {
  attendanceStatus: AttendanceSaveState
  event: CommunityEvent
  registrants: readonly Registrant[]
  members: readonly Member[]
  onBack: () => void
  onToggleCheckIn: (registrantId: string) => void
  onAddWalkIn: (walkIn: WalkInFields) => void
  onRefresh: () => void
}

export const CheckInScreen = ({
  attendanceStatus,
  event,
  registrants,
  members,
  onBack,
  onToggleCheckIn,
  onAddWalkIn,
  onRefresh,
}: CheckInScreenProps) => {
  const tabsBaseId = useId()
  const tabPanelId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tabPanelRef = useRef<HTMLDivElement>(null)
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<CheckInTab>('pending')
  const [isAddingWalkIn, setIsAddingWalkIn] = useState(false)
  const [lastAction, setLastAction] = useState<string | undefined>(undefined)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const interval = setInterval(onRefresh, REFRESH_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [onRefresh])

  const summary = summariseEventAttendance({ registrants, isClosedOut: false })
  const board = buildCheckInBoard({ registrants, searchText, activeTab })

  /* Deliberately no tab switch here: the organiser is working down the pending
     list with a queue in front of them, and moving the screen under their thumb
     would cost more than it saves. */
  const toggleCheckIn = (registrantId: string) => {
    const person = registrants.find((registrant) => registrant.id === registrantId)
    onToggleCheckIn(registrantId)
    if (person === undefined) {
      return
    }
    setLastAction(
      describeCheckInToggle({ name: person.name, wasCheckedIn: person.checkedInAt !== undefined }),
    )
  }

  const closeWalkInPanel = () => {
    setIsAddingWalkIn(false)
    searchInputRef.current?.focus()
  }

  const addWalkIn = ({
    walkIn,
    isCommunityMember,
  }: {
    walkIn: WalkInFields
    isCommunityMember: boolean
  }) => {
    onAddWalkIn(walkIn)
    closeWalkInPanel()
    setLastAction(
      describeWalkInAdded({
        name: walkIn.name.trim(),
        isCommunityMember,
        isMembersOnly: event.isMembersOnly,
      }),
    )
  }

  const checkInExistingRegistrant = (registrant: Registrant) => {
    toggleCheckIn(registrant.id)
    closeWalkInPanel()
  }

  const showOtherTab = () => {
    setActiveTab(otherCheckInTab(activeTab))
    tabPanelRef.current?.focus()
  }

  return (
    <div className={DOOR_SHEET_CLASSES}>
      <button className={BACK_BUTTON_CLASSES} onClick={onBack} type="button">
        <span aria-hidden="true">{BACK_ARROW} </span>
        Back to the event
      </button>

      <h3 className="text-2xl font-bold text-ink">
        Check in: {event.name}
      </h3>

      <AttendanceSaveStatus state={attendanceStatus} />

      {/* Sticky: at a door the search box, the two tabs and the running total
          are the screen. Everything above them is read once and scrolled away. */}
      <div className={DOOR_CONTROLS_CLASSES}>
        <DoorSearchField
          inputRef={searchInputRef}
          label="Search by name or email"
          onChange={setSearchText}
          value={searchText}
        />
        <CheckInTabs
          activeTab={activeTab}
          arrivedCount={board.arrivedCount}
          baseId={tabsBaseId}
          onSelectTab={setActiveTab}
          panelId={tabPanelId}
          pendingCount={board.pendingCount}
        />
        <CheckInCounter
          checkedInCount={summary.checkedInCount}
          expectedCount={summary.expectedCount}
          lastAction={lastAction}
        />
      </div>

      {isAddingWalkIn ? (
        <WalkInPanel
          isMembersOnly={event.isMembersOnly}
          members={members}
          onAddMember={(member) =>
            addWalkIn({ walkIn: toWalkInFieldsFromMember(member), isCommunityMember: true })
          }
          onAddNonMember={(walkIn) => addWalkIn({ walkIn, isCommunityMember: false })}
          onCancel={closeWalkInPanel}
          onCheckInExisting={checkInExistingRegistrant}
          registrants={registrants}
        />
      ) : (
        <button
          className={WALK_IN_BUTTON_CLASSES}
          onClick={() => setIsAddingWalkIn(true)}
          type="button"
        >
          Add someone not on the list
        </button>
      )}

      <CheckInTabPanel
        activeTab={activeTab}
        board={board}
        eventRegistrants={registrants}
        labelledBy={toTabButtonId({ baseId: tabsBaseId, tab: activeTab })}
        members={members}
        onShowOtherTab={showOtherTab}
        onToggle={toggleCheckIn}
        panelId={tabPanelId}
        panelRef={tabPanelRef}
      />
    </div>
  )
}
