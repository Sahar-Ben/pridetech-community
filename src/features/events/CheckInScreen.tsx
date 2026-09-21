import { useEffect, useId, useRef, useState } from 'react'
import { LocalOnlySaveNotice } from '../members/LocalOnlySaveNotice'
import { CheckInCounter } from './CheckInCounter'
import { CheckInDemoNotice } from './CheckInDemoNotice'
import { CheckInTabPanel } from './CheckInTabPanel'
import { CheckInTabs } from './CheckInTabs'
import { DoorSearchField } from './DoorSearchField'
import { WalkInPanel } from './WalkInPanel'
import { buildCheckInBoard, otherCheckInTab, toTabButtonId, type CheckInTab } from './checkInBoard'
import { describeCheckInToggle, describeWalkInAdded } from './checkInActionText'
import { toWalkInFieldsFromMember } from './checkIn'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from './eventButtonStyles'
import { summariseEventAttendance } from './eventAttendance'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { WalkInFields } from './walkInValidation'

const BACK_ARROW = '\u{2190}'

const STICKY_DOOR_CONTROLS_CLASSES =
  'sticky top-0 z-10 flex flex-col gap-2 bg-slate-50 py-2 dark:bg-slate-950'

const WALK_IN_BUTTON_CLASSES = `w-full ${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const BACK_BUTTON_CLASSES = `self-start ${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type CheckInScreenProps = {
  event: CommunityEvent
  registrants: readonly Registrant[]
  members: readonly Member[]
  onBack: () => void
  onToggleCheckIn: (registrantId: string) => void
  onAddWalkIn: (walkIn: WalkInFields) => void
}

export const CheckInScreen = ({
  event,
  registrants,
  members,
  onBack,
  onToggleCheckIn,
  onAddWalkIn,
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
    <div className="flex flex-col gap-3">
      <button className={BACK_BUTTON_CLASSES} onClick={onBack} type="button">
        <span aria-hidden="true">{BACK_ARROW} </span>
        Back to the event
      </button>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Check in: {event.name}
      </h3>

      <CheckInDemoNotice />

      <div aria-live="polite">{lastAction !== undefined && <LocalOnlySaveNotice />}</div>

      {/* Sticky: at a door the search box, the two tabs and the running total
          are the screen. Everything above them is read once and scrolled away. */}
      <div className={STICKY_DOOR_CONTROLS_CLASSES}>
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
