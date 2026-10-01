import { SectionIcon } from './SectionIcon'
import { SECTION_LABELS, SECTIONS, type Section } from './section'

/* One nav, two placements. On a phone it is a pill floating over the bottom of
   the screen, under the thumb, four equal tabs; from `md` up the same element
   becomes a rail down the left edge. One element rather than two keeps a
   single landmark and a single set of buttons for a screen reader to meet. */
const NAV_CLASSES = [
  'fixed z-40 grid gap-1 border border-card-edge bg-nav p-1.5 shadow-[var(--shadow-nav)]',
  'inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] h-[70px] grid-cols-4 rounded-[var(--radius-brand-lg)]',
  'md:inset-x-auto md:top-[88px] md:bottom-auto md:left-4 md:h-auto md:w-52 md:grid-cols-1 md:gap-1.5 md:p-2',
].join(' ')

const ITEM_BASE_CLASSES = [
  'flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[20px] text-[11px]',
  'transition-colors duration-150 ease-brand',
  'md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-2xl md:px-4 md:text-sm',
].join(' ')

const itemClasses = (isActive: boolean): string =>
  [
    ITEM_BASE_CLASSES,
    isActive
      ? 'bg-nav-active font-semibold text-accent'
      : 'font-medium text-ink-muted hover:bg-glass-hover hover:text-ink',
  ].join(' ')

type SectionNavProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
}

export const SectionNav = ({ activeSection, onSelectSection }: SectionNavProps) => (
  <nav aria-label="Sections" className={NAV_CLASSES}>
    {SECTIONS.map((section) => (
      <button
        aria-current={section === activeSection ? 'page' : undefined}
        className={itemClasses(section === activeSection)}
        key={section}
        onClick={() => onSelectSection(section)}
        type="button"
      >
        <SectionIcon section={section} />
        <span>{SECTION_LABELS[section]}</span>
      </button>
    ))}
  </nav>
)
