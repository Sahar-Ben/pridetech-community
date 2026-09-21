import { EventsWorkspace } from './EventsWorkspace'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

type EventsSectionProps = {
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  members: readonly Member[]
  today: string
}

export const EventsSection = ({ events, registrants, members, today }: EventsSectionProps) => (
  <section className="mx-auto w-full max-w-3xl px-4 pb-10">
    <header className="py-3">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Events</h2>
    </header>
    <EventsWorkspace events={events} members={members} registrants={registrants} today={today} />
  </section>
)
