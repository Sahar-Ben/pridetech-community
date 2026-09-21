import { useRef, type KeyboardEvent } from 'react'
import { CheckInTabButton } from './CheckInTabButton'
import { findTabForArrowKey, toTabButtonId, type CheckInTab } from './checkInBoard'

type CheckInTabsProps = {
  baseId: string
  panelId: string
  activeTab: CheckInTab
  pendingCount: number
  arrivedCount: number
  onSelectTab: (tab: CheckInTab) => void
}

export const CheckInTabs = ({
  baseId,
  panelId,
  activeTab,
  pendingCount,
  arrivedCount,
  onSelectTab,
}: CheckInTabsProps) => {
  const pendingTabRef = useRef<HTMLButtonElement>(null)
  const arrivedTabRef = useRef<HTMLButtonElement>(null)

  /* Selection follows focus, which is what makes an arrow key a way of reading
     the other list rather than a two-step commitment. */
  const selectAndFocusTab = (tab: CheckInTab) => {
    onSelectTab(tab)
    const tabRef = tab === 'pending' ? pendingTabRef : arrivedTabRef
    tabRef.current?.focus()
  }

  const moveOnArrowKey = (keyboardEvent: KeyboardEvent<HTMLButtonElement>) => {
    const nextTab = findTabForArrowKey({ key: keyboardEvent.key, activeTab })
    if (nextTab === undefined) {
      return
    }
    keyboardEvent.preventDefault()
    selectAndFocusTab(nextTab)
  }

  return (
    <div aria-label="Check-in lists" className="flex gap-2" role="tablist">
      <CheckInTabButton
        buttonRef={pendingTabRef}
        count={pendingCount}
        isSelected={activeTab === 'pending'}
        label="Pending"
        onKeyDown={moveOnArrowKey}
        onSelect={() => onSelectTab('pending')}
        panelId={panelId}
        tabId={toTabButtonId({ baseId, tab: 'pending' })}
      />
      <CheckInTabButton
        buttonRef={arrivedTabRef}
        count={arrivedCount}
        isSelected={activeTab === 'arrived'}
        label="Arrived"
        onKeyDown={moveOnArrowKey}
        onSelect={() => onSelectTab('arrived')}
        panelId={panelId}
        tabId={toTabButtonId({ baseId, tab: 'arrived' })}
      />
    </div>
  )
}
