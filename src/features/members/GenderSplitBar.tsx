import type { GenderSplit } from './genderSplit'

const SEGMENT_CLASSES = {
  women: 'bg-on-brand',
  men: 'bg-on-brand/55',
  unrecorded: 'bg-on-brand/20',
} as const

const SEGMENT_TRANSITION_CLASSES = 'transition-[width] duration-200 ease-brand'

type GenderSplitBarProps = {
  split: GenderSplit
}

/* Decoration for the sentence beside it, which already states every number,
   so the bar itself is hidden from assistive technology. That is also why it
   is the one place alpha-on-glass is fine: nothing here is text. */
export const GenderSplitBar = ({ split }: GenderSplitBarProps) => (
  <div
    aria-hidden="true"
    className="flex h-2 w-full max-w-md overflow-hidden rounded-full bg-on-brand/15"
  >
    <div
      className={`${SEGMENT_CLASSES.women} ${SEGMENT_TRANSITION_CLASSES}`}
      style={{ width: `${split.womenPercentage}%` }}
    />
    <div
      className={`${SEGMENT_CLASSES.men} ${SEGMENT_TRANSITION_CLASSES}`}
      style={{ width: `${split.menPercentage}%` }}
    />
    <div
      className={`${SEGMENT_CLASSES.unrecorded} ${SEGMENT_TRANSITION_CLASSES}`}
      style={{ width: `${split.unrecordedPercentage}%` }}
    />
  </div>
)
