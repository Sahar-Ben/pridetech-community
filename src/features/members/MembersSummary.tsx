import { memo } from 'react'
import { GenderSplitBar } from './GenderSplitBar'
import { calculateGenderSplit } from './genderSplit'
import type { Member } from './member'
import { selectActiveMembers } from './memberFilters'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const SEPARATOR = ' \u{00b7} '

/* The same panel as the filter bar and the table under it. Nothing here is
   read row by row, so shell glass would have been legible enough on its own --
   but it would have been a pale band between two deep ones, and the split bar's
   three white tints need one known fill behind them rather than the gradient. */
const SUMMARY_CLASSES = `${WORK_PANEL_CLASSES} animate-rise flex flex-col gap-3 px-5 py-4`

type MembersSummaryProps = {
  members: readonly Member[]
}

const MembersSummaryView = ({ members }: MembersSummaryProps) => {
  const activeMembers = selectActiveMembers(members)
  const split = calculateGenderSplit(activeMembers)

  return (
    <div className={SUMMARY_CLASSES}>
      <p className="text-[22px] leading-none font-semibold tracking-[-0.03em] text-on-brand">
        {members.length} members{SEPARATOR}
        {activeMembers.length} active
      </p>
      <p className="text-sm text-ink-muted">
        Gender of active members: {split.womenPercentage}% women ({split.womenCount}){SEPARATOR}
        {split.menPercentage}% men ({split.menCount}){SEPARATOR}
        {split.unrecordedPercentage}% not recorded ({split.unrecordedCount})
      </p>
      <GenderSplitBar split={split} />
    </div>
  )
}

/* The gender split walks all 787 members three times, and nothing about it
   changes while somebody is typing in the search box. */
export const MembersSummary = memo(MembersSummaryView)
