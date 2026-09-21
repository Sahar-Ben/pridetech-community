import type { Ref } from 'react'
import { SECTION_LABELS, SECTIONS, type Section } from './section'
import { SidebarFooter } from './SidebarFooter'
import type { WorkspaceAccount } from './workspaceAccount'

/* Off-canvas until opened on phones; a permanent left-hand rail from `md` up.
   `invisible` keeps the closed drawer out of the tab order without JavaScript
   having to know the viewport width, and `md:visible` brings the rail back. */
const DRAWER_STATE_CLASSES = {
  open: 'translate-x-0 visible',
  closed: '-translate-x-full invisible',
} as const

/* The rail is the one place the app looks most like the website: glass over the
   gradient, 28px corners on its inner edge, Sulphur Point on the wordmark. It
   holds three words and a title, so nothing dense is riding on the translucency. */
/* `overflow-y-auto` is what lets the footer stay pinned on a short phone: the
   rail is viewport-tall, and a drawer whose sections and footer together exceed
   667px has to scroll rather than push the footer off the bottom. */
const NAV_CLASSES = [
  'fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-6 overflow-y-auto p-4',
  'border-r border-glass-edge bg-glass backdrop-blur-2xl',
  'rounded-r-[var(--radius-brand-lg)] shadow-glass',
  'transition-transform duration-200 ease-brand outline-none',
  'md:visible md:w-60 md:translate-x-0',
].join(' ')

const ITEM_BASE_CLASSES = [
  'flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-semibold',
  'transition-[background-color,color,box-shadow] duration-150 ease-brand',
].join(' ')

const itemClasses = ({ isActive }: { isActive: boolean }): string =>
  [
    ITEM_BASE_CLASSES,
    isActive
      ? 'bg-on-brand text-brand-violet shadow-sm'
      : 'text-on-brand hover:bg-glass-hover',
  ].join(' ')

type SidebarNavProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  account: WorkspaceAccount
  isOpen: boolean
  ref?: Ref<HTMLElement>
}

export const SidebarNav = ({
  activeSection,
  onSelectSection,
  account,
  isOpen,
  ref,
}: SidebarNavProps) => (
  <nav
    aria-label="Sections"
    className={`${NAV_CLASSES} ${isOpen ? DRAWER_STATE_CLASSES.open : DRAWER_STATE_CLASSES.closed}`}
    ref={ref}
    tabIndex={-1}
  >
    <div className="flex items-stretch gap-3 px-2 pt-2">
      <span aria-hidden="true" className="rainbow-mark" />
      <span className="font-display text-2xl leading-tight font-light tracking-tight text-on-brand">
        PrideTech
      </span>
    </div>

    <ul className="flex flex-col gap-1.5">
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

    <SidebarFooter account={account} />
  </nav>
)
