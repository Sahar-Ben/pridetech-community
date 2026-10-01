import { useEffect, useId, useRef } from 'react'
import {
  LEAD_SORT_LABELS,
  LEAD_SORTS,
  LINKEDIN_FILTER_LABELS,
  LINKEDIN_FILTERS,
  type FacetOption,
  type LeadListQuery,
} from './leadListQuery'
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const SCRIM_CLASSES = 'fixed inset-0 z-50 bg-[rgb(4_3_10/0.7)] backdrop-blur-sm animate-fade'

/* A bottom sheet on a phone -- the controls land under the thumb and the list
   stays visible above it -- and a centred panel from `md` up. */
const SHEET_CLASSES = [
  'fixed z-50 flex flex-col border border-card-strong-edge bg-nav shadow-[var(--shadow-nav)] outline-none',
  'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px] pb-[env(safe-area-inset-bottom)] animate-slide-up',
  'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[80dvh] md:w-[480px]',
  'md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-brand-lg)] md:pb-0',
].join(' ')

const SECTION_TITLE_CLASSES =
  'font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase'

const OPTION_ROW_CLASSES = [
  'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl px-3.5 text-[15px]',
  'text-ink transition-colors duration-150 ease-brand hover:bg-surface',
  'has-[:checked]:bg-nav-active has-[:checked]:font-semibold has-[:checked]:text-accent',
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
  'has-[:focus-visible]:outline-[var(--ui-focus-ring)]',
].join(' ')

const chipClasses = (isSelected: boolean): string =>
  [
    'flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm',
    'transition-colors duration-150 ease-brand',
    isSelected
      ? 'border-accent-solid bg-accent-solid font-bold text-on-accent'
      : 'border-card-strong-edge bg-card text-neutral-ink hover:bg-surface',
  ].join(' ')

const FOOTER_BUTTON_SIZE = 'min-h-[52px] px-4 text-[15px]'

type LeadsFilterSheetProps = {
  query: LeadListQuery
  cityOptions: readonly FacetOption[]
  interestOptions: readonly FacetOption[]
  resultCount: number
  onQueryChange: (query: LeadListQuery) => void
  onClearAll: () => void
  onClose: () => void
}

const Check = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.4"
    viewBox="0 0 24 24"
    width="18"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
)

/* Every change applies as it is made, so the count on the footer button is
   always the number the reviewer will see; the button only closes the sheet.
   City and interest are single choices -- tapping the chosen one again lets
   it go -- because "Tel Aviv or Haifa" was never a question anybody asked of
   this queue and a single choice keeps the chip row honest. */
export const LeadsFilterSheet = ({
  query,
  cityOptions,
  interestOptions,
  resultCount,
  onQueryChange,
  onClearAll,
  onClose,
}: LeadsFilterSheetProps) => {
  const headingId = useId()
  const sortGroupName = useId()
  const linkedInGroupName = useId()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sheetRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    /* The page behind does not scroll while the sheet is up, or a swipe on
       the sheet's edge would move the list instead of the sheet. */
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const update = (changes: Partial<LeadListQuery>) => onQueryChange({ ...query, ...changes })

  return (
    <>
      <button
        aria-label="Close filters"
        className={SCRIM_CLASSES}
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className={SHEET_CLASSES}
        ref={sheetRef}
        role="dialog"
        tabIndex={-1}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-card-strong-edge md:hidden"
        />
        <header className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink" id={headingId}>
            Sort & filter
          </h2>
          <button
            className="min-h-11 rounded-2xl px-3 text-sm font-semibold text-accent hover:bg-surface"
            onClick={onClearAll}
            type="button"
          >
            Clear all
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto overscroll-contain px-5 pt-2 pb-5">
          <fieldset className="flex flex-col gap-1.5">
            <legend className={`${SECTION_TITLE_CLASSES} mb-2`}>Sort by</legend>
            {LEAD_SORTS.map((sort) => (
              <label className={OPTION_ROW_CLASSES} key={sort}>
                <input
                  checked={query.sort === sort}
                  className="sr-only"
                  name={sortGroupName}
                  onChange={() => update({ sort })}
                  type="radio"
                  value={sort}
                />
                <span>{LEAD_SORT_LABELS[sort]}</span>
                {query.sort === sort && <Check />}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={`${SECTION_TITLE_CLASSES} mb-2`}>LinkedIn</legend>
            <div className="grid grid-cols-3 gap-1 rounded-[18px] border border-card-edge bg-card p-1">
              {LINKEDIN_FILTERS.map((filter) => (
                <label
                  className={[
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-[14px] px-1 text-center text-[13px]',
                    'text-neutral-ink transition-colors duration-150 ease-brand',
                    'has-[:checked]:bg-accent-solid has-[:checked]:font-bold has-[:checked]:text-on-accent',
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                    'has-[:focus-visible]:outline-[var(--ui-focus-ring)]',
                  ].join(' ')}
                  key={filter}
                >
                  <input
                    checked={query.linkedIn === filter}
                    className="sr-only"
                    name={linkedInGroupName}
                    onChange={() => update({ linkedIn: filter })}
                    type="radio"
                    value={filter}
                  />
                  {LINKEDIN_FILTER_LABELS[filter]}
                </label>
              ))}
            </div>
          </fieldset>

          {cityOptions.length > 0 && (
            <div aria-labelledby={`${headingId}-city`} className="flex flex-col gap-2" role="group">
              <span className={SECTION_TITLE_CLASSES} id={`${headingId}-city`}>
                City
              </span>
              <div className="flex flex-wrap gap-2">
                {cityOptions.map((option) => {
                  const isSelected = query.city === option.value
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={chipClasses(isSelected)}
                      key={option.value}
                      onClick={() => update({ city: isSelected ? undefined : option.value })}
                      type="button"
                    >
                      {option.value}
                      <span aria-hidden="true" className="font-mono text-[11px] opacity-70">
                        {option.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {interestOptions.length > 0 && (
            <div
              aria-labelledby={`${headingId}-interest`}
              className="flex flex-col gap-2"
              role="group"
            >
              <span className={SECTION_TITLE_CLASSES} id={`${headingId}-interest`}>
                Interest
              </span>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((option) => {
                  const isSelected = query.interest === option.value
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={chipClasses(isSelected)}
                      key={option.value}
                      onClick={() => update({ interest: isSelected ? undefined : option.value })}
                      type="button"
                    >
                      {option.value}
                      <span aria-hidden="true" className="font-mono text-[11px] opacity-70">
                        {option.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <footer className="grid grid-cols-[1fr_1.6fr] gap-2 border-t border-card-edge px-5 pt-3 pb-4">
          <button
            className={`${SECONDARY_BUTTON_CLASSES} ${FOOTER_BUTTON_SIZE}`}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className={`${PRIMARY_BUTTON_CLASSES} ${FOOTER_BUTTON_SIZE}`}
            onClick={onClose}
            type="button"
          >
            {resultCount === 1 ? 'Show 1 application' : `Show ${resultCount} applications`}
          </button>
        </footer>
      </div>
    </>
  )
}
