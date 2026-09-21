/* Sidebar order, and Overview is first because it is what the workspace opens
   on: a rail whose first item is not the one already showing sends people
   looking for the screen they are already on. */
export const SECTIONS = ['overview', 'leads', 'members', 'events'] as const

export type Section = (typeof SECTIONS)[number]

export const DEFAULT_SECTION: Section = 'overview'

export const SECTION_LABELS: Readonly<Record<Section, string>> = {
  overview: 'Overview',
  leads: 'Leads',
  members: 'Members',
  events: 'Events',
}
