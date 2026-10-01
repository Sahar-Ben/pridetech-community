import type { Section } from './section'

/* Stroke icons drawn at 24 and shown at 22, in `currentColor` so the active
   item's accent reaches the glyph without a second class. */
const SECTION_ICON_PATHS: Readonly<Record<Section, string[]>> = {
  overview: [
    'M5 3h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M16 3h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M16 12h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z',
    'M5 16h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2z',
  ],
  leads: [
    'M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7',
    'M19 8v6',
    'M16 11h6',
  ],
  members: [
    'M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7',
    'M16 4.1a4 4 0 0 1 0 7.8',
    'M22 21c0-3-1.8-5.6-4.5-6.6',
  ],
  events: [
    'M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z',
    'M3 10h18',
    'M8 3v4',
    'M16 3v4',
  ],
}

export const SectionIcon = ({ section }: { section: Section }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="22"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="22"
  >
    {SECTION_ICON_PATHS[section].map((path) => (
      <path d={path} key={path} />
    ))}
  </svg>
)
