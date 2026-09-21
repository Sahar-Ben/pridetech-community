import { useState } from 'react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceSection } from './WorkspaceSection'
import type { SheetsClient } from '../sheets/sheetsClient'
import { AppShell } from '../shell/AppShell'
import { DEFAULT_SECTION, type Section } from '../shell/section'

type CommunityWorkspaceProps = {
  sheetsClient: SheetsClient
  spreadsheetName: string | undefined
  onSessionExpired: () => void
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const CommunityWorkspace = ({
  sheetsClient,
  spreadsheetName,
  onSessionExpired,
  onChangeSpreadsheet,
  onSignOut,
}: CommunityWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<Section>(DEFAULT_SECTION)
  const account = { spreadsheetName, onChangeSpreadsheet, onSignOut }

  return (
    <AppShell
      account={account}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
    >
      <WorkspaceHeader />
      <WorkspaceSection
        section={activeSection}
        sheetsClient={sheetsClient}
        onSessionExpired={onSessionExpired}
      />
    </AppShell>
  )
}
