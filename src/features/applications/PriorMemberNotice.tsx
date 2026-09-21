import type { MemberMatch } from './memberEmailIndex'
import { describePriorMember, describePriorMemberRemoval } from './priorMemberText'
import { NOTICE_SURFACE_CLASSES } from '../../theme/surfaces'

const NOTICE_CLASSES = `rounded-xl border px-3 py-2 ${NOTICE_SURFACE_CLASSES.warning}`

type PriorMemberNoticeProps = {
  priorMember: MemberMatch
}

/* Sits on the card, before the buttons, because approving a returning member is
   a different act from approving a newcomer and the reviewer has to know which
   one they are about to take. */
export const PriorMemberNotice = ({ priorMember }: PriorMemberNoticeProps) => {
  const removalNote = describePriorMemberRemoval({ priorMember })

  return (
    <div className={NOTICE_CLASSES}>
      <p className="text-xs font-medium">{describePriorMember({ priorMember })}</p>
      {removalNote !== undefined && <p className="mt-0.5 text-xs font-bold">{removalNote}</p>}
    </div>
  )
}
