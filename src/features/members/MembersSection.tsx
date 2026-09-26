import { MembersDirectory } from './MembersDirectory'
import { MemberEventHistoryPanel } from '../eventHistory/MemberEventHistoryPanel'
import { useCommunityEventHistory } from '../eventHistory/useCommunityEventHistory'
import type { ResponseSheetAccess } from '../events/responseSheetAccess'
import { useMemberSave } from './useMemberSave'
import { useMembers } from './useMembers'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'

type MembersSectionProps = {
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
}

export const MembersSection = ({
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
}: MembersSectionProps) => {
  const { state, reload, replaceLoadedMember } = useMembers({ sheetsClient, onSessionExpired })
  const saveMember = useMemberSave({
    sheetsClient,
    onSessionExpired,
    onSaved: replaceLoadedMember,
  })
  const eventHistory = useCommunityEventHistory({
    sheetsClient,
    access: responseSheetAccess,
    onSessionExpired,
  })

  if (state.status === 'loading') {
    return (
      <p
        className="mx-auto w-full max-w-4xl px-4 py-10 text-on-brand"
        role="status"
      >
        Reading the community from the Members tab...
      </p>
    )
  }

  if (state.status === 'failed') {
    return <SectionErrorNotice message={state.message} onRetry={reload} />
  }

  return (
    <MembersDirectory
      members={state.members}
      onSaveMember={saveMember}
      renderEventHistory={(member) => (
        <MemberEventHistoryPanel members={state.members} member={member} resource={eventHistory} />
      )}
    />
  )
}
