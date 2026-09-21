import type { GenderSplit } from './genderSplit'

const SEGMENT_CLASSES = {
  women: 'bg-indigo-500',
  men: 'bg-slate-400',
  unrecorded: 'bg-slate-200 dark:bg-slate-700',
} as const

type GenderSplitBarProps = {
  split: GenderSplit
}

/* Decoration for the sentence beside it, which already states every number,
   so the bar itself is hidden from assistive technology. */
export const GenderSplitBar = ({ split }: GenderSplitBarProps) => (
  <div
    aria-hidden="true"
    className="flex h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
  >
    <div className={SEGMENT_CLASSES.women} style={{ width: `${split.womenPercentage}%` }} />
    <div className={SEGMENT_CLASSES.men} style={{ width: `${split.menPercentage}%` }} />
    <div
      className={SEGMENT_CLASSES.unrecorded}
      style={{ width: `${split.unrecordedPercentage}%` }}
    />
  </div>
)
