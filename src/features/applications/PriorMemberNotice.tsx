import type { MemberMatch } from './memberEmailIndex'
import { describePriorMember, describePriorMemberRemoval } from './priorMemberText'

type PriorMemberNoticeProps = {
  priorMember: MemberMatch
}

/* Sits on the card, before the buttons, because approving a returning member is
   a different act from approving a newcomer and the reviewer has to know which
   one they are about to take. */
export const PriorMemberNotice = ({ priorMember }: PriorMemberNoticeProps) => {
  const removalNote = describePriorMemberRemoval({ priorMember })

  return (
    <div className="rounded-md border border-amber-500 bg-amber-50 px-3 py-2 dark:border-amber-600 dark:bg-amber-950">
      <p className="text-xs text-amber-900 dark:text-amber-200">
        {describePriorMember({ priorMember })}
      </p>
      {removalNote !== undefined && (
        <p className="mt-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {removalNote}
        </p>
      )}
    </div>
  )
}
