import { createRoot } from 'react-dom/client'
import './harness.css'
import { HARNESS_TABS } from './fixtures'
import { CommunityWorkspace } from '../../src/app/CommunityWorkspace'
import { createFakeResponseSheetAccess } from '../../src/testing/eventsRegistryFactory'
import { createFakeSheet } from '../../src/testing/fakeSheet'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element #root was not found in the harness page')
}

const sheet = createFakeSheet({ tabs: HARNESS_TABS })

createRoot(rootElement).render(
  <CommunityWorkspace
    onChangeSpreadsheet={() => undefined}
    onSessionExpired={() => undefined}
    onSignOut={() => undefined}
    responseSheetAccess={createFakeResponseSheetAccess()}
    sheetsClient={sheet.client}
    spreadsheetName="E2E HARNESS"
  />,
)
