import { MembersDirectory } from './MembersDirectory'
import { MemberEventHistoryPanel } from '../eventHistory/MemberEventHistoryPanel'
import {
  useCommunityEventHistory,
  type CommunityEventHistoryResource,
} from '../eventHistory/useCommunityEventHistory'
import type { EventCountFilter } from '../eventHistory/memberEventCounts'
import type { ResponseSheetAccess } from '../events/responseSheetAccess'
import { useMemberSave } from './useMemberSave'
import { useMembers } from './useMembers'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'

type MembersSectionProps = {
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
  /* The workspace's read of every event, shared with the Overview so moving
     between the two reads the sheets once. Without one this screen keeps its
     own, which reads nothing until it is asked. */
  eventHistory?: CommunityEventHistoryResource
  /* Opened from the Overview's events chart: the directory starts on active
     members filtered to that band. */
  initialEventCountFilter?: EventCountFilter
}

export const MembersSection = ({
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
  eventHistory: sharedEventHistory,
  initialEventCountFilter,
}: MembersSectionProps) => {
  const { state, reload, replaceLoadedMember } = useMembers({ sheetsClient, onSessionExpired })
  const saveMember = useMemberSave({
    sheetsClient,
    onSessionExpired,
    onSaved: replaceLoadedMember,
  })
  const ownEventHistory = useCommunityEventHistory({
    sheetsClient,
    access: responseSheetAccess,
    onSessionExpired,
  })
  const eventHistory = sharedEventHistory ?? ownEventHistory

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
      eventHistory={eventHistory}
      initialEventCountFilter={initialEventCountFilter}
      members={state.members}
      onSaveMember={saveMember}
      renderEventHistory={(member) => (
        <MemberEventHistoryPanel members={state.members} member={member} resource={eventHistory} />
      )}
    />
  )
}
