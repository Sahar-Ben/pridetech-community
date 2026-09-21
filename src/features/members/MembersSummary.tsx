import { GenderSplitBar } from './GenderSplitBar'
import { calculateGenderSplit } from './genderSplit'
import type { Member } from './member'
import { selectActiveMembers } from './memberFilters'

const SEPARATOR = ' \u{00b7} '

type MembersSummaryProps = {
  members: readonly Member[]
}

export const MembersSummary = ({ members }: MembersSummaryProps) => {
  const activeMembers = selectActiveMembers(members)
  const split = calculateGenderSplit(activeMembers)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {members.length} members{SEPARATOR}
        {activeMembers.length} active
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Gender of active members: {split.womenPercentage}% women ({split.womenCount}){SEPARATOR}
        {split.menPercentage}% men ({split.menCount}){SEPARATOR}
        {split.unrecordedPercentage}% not recorded ({split.unrecordedCount})
      </p>
      <GenderSplitBar split={split} />
    </div>
  )
}
