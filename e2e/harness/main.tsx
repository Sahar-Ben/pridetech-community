import { createRoot } from 'react-dom/client'
import './harness.css'
import { HARNESS_TABS } from './fixtures'
import { CommunityWorkspace } from '../../src/app/CommunityWorkspace'
import { createFakeResponseSheetAccess } from '../../src/testing/eventsRegistryFactory'
import { withReadCache } from '../../src/sheets/readCache'
import { createFakeSheet } from '../../src/testing/fakeSheet'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element #root was not found in the harness page')
}

/* Every read that reaches the sheet is counted, so a test can hold the app to
   Google's per-minute read quota; the client is wrapped in the same display
   cache as the real app. */
declare global {
  interface Window {
    harnessReads: string[]
  }
}
window.harnessReads = []

const sheet = createFakeSheet({
  tabs: HARNESS_TABS,
  onRead: (range) => {
    window.harnessReads.push(range)
  },
})

const sheetsClient = withReadCache(sheet.client)

/* Shown in the account menu as on a phone that can use Face ID, so the menu's
   layout is checked with every control it can hold. */
const screenLock = {
  isAvailable: true,
  isOn: false,
  isLocked: false,
  isBusy: false,
  message: undefined,
  unlock: () => undefined,
  turnOn: () => undefined,
  turnOff: () => undefined,
}

createRoot(rootElement).render(
  <CommunityWorkspace
    onChangeSpreadsheet={() => undefined}
    onSessionExpired={() => undefined}
    onSignOut={() => undefined}
    responseSheetAccess={createFakeResponseSheetAccess()}
    screenLock={screenLock}
    sheetsClient={sheetsClient}
    spreadsheetName="E2E HARNESS"
  />,
)
