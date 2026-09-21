import { SampleSectionNotice } from './SampleSectionNotice'
import { LeadsSection } from '../features/applications/LeadsSection'
import { EventsSection } from '../features/events/EventsSection'
import { toIsoDateString } from '../features/events/eventDate'
import { SAMPLE_EVENTS } from '../features/events/sampleEvents'
import { SAMPLE_EVENT_REGISTRANTS } from '../features/events/sampleEventRegistrants'
import { MembersDirectory } from '../features/members/MembersDirectory'
import { SAMPLE_MEMBERS } from '../features/members/sampleMembers'
import type { SheetsClient } from '../sheets/sheetsClient'
import type { Section } from '../shell/section'

type WorkspaceSectionProps = {
  section: Section
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}

export const WorkspaceSection = ({
  section,
  sheetsClient,
  onSessionExpired,
}: WorkspaceSectionProps) => {
  if (section === 'leads') {
    return <LeadsSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />
  }

  if (section === 'members') {
    return (
      <div className="flex flex-col gap-3">
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <SampleSectionNotice sectionName="member" />
        </div>
        <MembersDirectory members={SAMPLE_MEMBERS} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <SampleSectionNotice sectionName="event" />
      </div>
      <EventsSection
        events={SAMPLE_EVENTS}
        members={SAMPLE_MEMBERS}
        registrants={SAMPLE_EVENT_REGISTRANTS}
        today={toIsoDateString(new Date())}
      />
    </div>
  )
}
