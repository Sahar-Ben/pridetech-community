import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../../theme/controls'
import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const CARD_CLASSES = `${CHART_PANEL_CLASSES} animate-rise flex flex-col gap-3.5 border-card-strong-edge p-5`

const START_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES} w-full`

const describeWaiting = (count: number): string => {
  if (count === 0) {
    return 'No applications waiting'
  }
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'application' : 'applications'} waiting`
}

type ReviewQueueCardProps = {
  waitingCount: number
  onStartReviewing: () => void
}

/* The way from the numbers to the work: one sentence saying how much is
   waiting and one button that opens the queue. */
export const ReviewQueueCard = ({ waitingCount, onStartReviewing }: ReviewQueueCardProps) => (
  <section aria-labelledby="review-queue-heading" className={CARD_CLASSES}>
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
        Review queue
      </span>
      <h3
        className="text-xl font-semibold tracking-[-0.02em] text-on-brand"
        id="review-queue-heading"
      >
        {describeWaiting(waitingCount)}
      </h3>
    </div>
    <button className={START_BUTTON_CLASSES} onClick={onStartReviewing} type="button">
      {waitingCount === 0 ? 'Open Leads' : 'Start reviewing'}
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
        width="18"
      >
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </button>
  </section>
)
