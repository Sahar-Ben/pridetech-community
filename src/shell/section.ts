export const SECTIONS = ['leads', 'members', 'events'] as const

export type Section = (typeof SECTIONS)[number]

export const SECTION_LABELS: Readonly<Record<Section, string>> = {
  leads: 'Leads',
  members: 'Members',
  events: 'Events',
}
