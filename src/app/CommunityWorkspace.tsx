import { useState } from 'react'
import { WorkspaceSection } from './WorkspaceSection'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'
import type { SheetsClient } from '../sheets/sheetsClient'
import { AppShell } from '../shell/AppShell'
import { DEFAULT_SECTION, type Section } from '../shell/section'

type CommunityWorkspaceProps = {
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  spreadsheetName: string | undefined
  onSessionExpired: () => void
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const CommunityWorkspace = ({
  sheetsClient,
  responseSheetAccess,
  spreadsheetName,
  onSessionExpired,
  onChangeSpreadsheet,
  onSignOut,
}: CommunityWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<Section>(DEFAULT_SECTION)
  const [waitingCount, setWaitingCount] = useState<number | undefined>(undefined)
  const account = { spreadsheetName, onChangeSpreadsheet, onSignOut }

  return (
    <AppShell
      account={account}
      activeSection={activeSection}
      leadsWaitingCount={waitingCount}
      onSelectSection={setActiveSection}
    >
      <WorkspaceSection
        onSelectSection={setActiveSection}
        onSessionExpired={onSessionExpired}
        onWaitingCountRead={setWaitingCount}
        responseSheetAccess={responseSheetAccess}
        section={activeSection}
        sheetsClient={sheetsClient}
      />
    </AppShell>
  )
}
