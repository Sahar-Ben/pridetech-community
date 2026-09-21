import type { Ref } from 'react'
import { SECTION_LABELS, SECTIONS, type Section } from './section'

/* Off-canvas until opened on phones; a permanent left-hand rail from `md` up.
   `invisible` keeps the closed drawer out of the tab order without JavaScript
   having to know the viewport width, and `md:visible` brings the rail back. */
const DRAWER_STATE_CLASSES = {
  open: 'translate-x-0 visible',
  closed: '-translate-x-full invisible',
} as const

const NAV_CLASSES = [
  'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4',
  'transition-transform duration-200 ease-out outline-none',
  'md:visible md:w-56 md:translate-x-0',
  'dark:border-slate-800 dark:bg-slate-900',
].join(' ')

const itemClasses = ({ isActive }: { isActive: boolean }): string =>
  [
    'w-full rounded-md px-3 py-2 text-left text-sm font-medium',
    isActive
      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  ].join(' ')

type SidebarNavProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  isOpen: boolean
  ref?: Ref<HTMLElement>
}

export const SidebarNav = ({ activeSection, onSelectSection, isOpen, ref }: SidebarNavProps) => (
  <nav
    aria-label="Sections"
    className={`${NAV_CLASSES} ${isOpen ? DRAWER_STATE_CLASSES.open : DRAWER_STATE_CLASSES.closed}`}
    ref={ref}
    tabIndex={-1}
  >
    <ul className="flex flex-col gap-1">
      {SECTIONS.map((section) => (
        <li key={section}>
          <button
            aria-current={section === activeSection ? 'page' : undefined}
            className={itemClasses({ isActive: section === activeSection })}
            onClick={() => onSelectSection(section)}
            type="button"
          >
            {SECTION_LABELS[section]}
          </button>
        </li>
      ))}
    </ul>
  </nav>
)
