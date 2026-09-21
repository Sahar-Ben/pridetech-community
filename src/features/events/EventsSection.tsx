import { EventsWorkspace } from './EventsWorkspace'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { SHELL_SECTION_TITLE_CLASSES } from '../../theme/surfaces'

type EventsSectionProps = {
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  members: readonly Member[]
  today: string
}

export const EventsSection = ({ events, registrants, members, today }: EventsSectionProps) => (
  <section className="mx-auto w-full max-w-4xl px-4 pb-12">
    <header className="py-3">
      <h2 className={SHELL_SECTION_TITLE_CLASSES}>Events</h2>
    </header>
    <EventsWorkspace events={events} members={members} registrants={registrants} today={today} />
  </section>
)
