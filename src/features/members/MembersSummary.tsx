import { memo } from 'react'
import { GenderSplitBar } from './GenderSplitBar'
import { calculateGenderSplit } from './genderSplit'
import type { Member } from './member'
import { selectActiveMembers } from './memberFilters'
import { GLASS_PANEL_CLASSES } from '../../theme/surfaces'

const SEPARATOR = ' \u{00b7} '

/* The one working screen where glass is allowed, because nothing here is read
   row by row: two totals and a sentence, all in white at 4.82:1 or better even
   over the lightest part of the gradient. The table below it stays opaque. */
const SUMMARY_CLASSES = `${GLASS_PANEL_CLASSES} animate-rise flex flex-col gap-3 px-5 py-4`

type MembersSummaryProps = {
  members: readonly Member[]
}

const MembersSummaryView = ({ members }: MembersSummaryProps) => {
  const activeMembers = selectActiveMembers(members)
  const split = calculateGenderSplit(activeMembers)

  return (
    <div className={SUMMARY_CLASSES}>
      <p className="font-display text-3xl leading-none font-light tracking-tight text-on-brand">
        {members.length} members{SEPARATOR}
        {activeMembers.length} active
      </p>
      <p className="text-sm font-medium text-on-brand">
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
