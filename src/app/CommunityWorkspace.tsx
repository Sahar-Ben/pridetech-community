import { useState } from 'react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceSection } from './WorkspaceSection'
import type { SheetsClient } from '../sheets/sheetsClient'
import { AppShell } from '../shell/AppShell'
import type { Section } from '../shell/section'

type CommunityWorkspaceProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const CommunityWorkspace = ({
  sheetsClient,
  onSessionExpired,
  onChangeSpreadsheet,
  onSignOut,
}: CommunityWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<Section>('leads')

  return (
    <AppShell activeSection={activeSection} onSelectSection={setActiveSection}>
      <WorkspaceHeader onChangeSpreadsheet={onChangeSpreadsheet} onSignOut={onSignOut} />
      <WorkspaceSection
        section={activeSection}
        sheetsClient={sheetsClient}
        onSessionExpired={onSessionExpired}
      />
    </AppShell>
  )
}
