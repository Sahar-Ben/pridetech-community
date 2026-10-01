import { useId } from 'react'
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
  'relative flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[20px] text-[11px]',
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

/* Pinned to the icon's corner on a phone, pushed to the row's end on the rail. */
const BADGE_CLASSES = [
  'absolute top-1 right-[calc(50%-30px)] rounded-full bg-badge px-1.5 py-px',
  'font-mono text-[10px] leading-4 font-bold text-on-badge',
  'md:static md:ml-auto',
].join(' ')

type SectionNavProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  leadsWaitingCount?: number
}

/* The badge is absent until a screen has read the queue, and absent at zero:
   a "0" on a tab is a notification about nothing. It is decoration for the
   eye; a screen reader hears the count as the button's description, so the
   button keeps its plain name. */
export const SectionNav = ({
  activeSection,
  onSelectSection,
  leadsWaitingCount,
}: SectionNavProps) => {
  const badgeDescriptionId = useId()
  const showsBadge = leadsWaitingCount !== undefined && leadsWaitingCount > 0

  return (
    <nav aria-label="Sections" className={NAV_CLASSES}>
      {SECTIONS.map((section) => {
        const hasBadge = section === 'leads' && showsBadge
        return (
          <button
            aria-current={section === activeSection ? 'page' : undefined}
            aria-describedby={hasBadge ? badgeDescriptionId : undefined}
            className={itemClasses(section === activeSection)}
            key={section}
            onClick={() => onSelectSection(section)}
            type="button"
          >
            <SectionIcon section={section} />
            <span>{SECTION_LABELS[section]}</span>
            {hasBadge && (
              <span aria-hidden="true" className={BADGE_CLASSES}>
                {leadsWaitingCount.toLocaleString('en-US')}
              </span>
            )}
          </button>
        )
      })}
      {showsBadge && (
        <span className="sr-only" id={badgeDescriptionId}>
          {`${leadsWaitingCount.toLocaleString('en-US')} waiting`}
        </span>
      )}
    </nav>
  )
}
