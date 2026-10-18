import { toEmailKey } from '../../sheets/emailKey'
import type { Lead } from './lead'

/* `leads` are the address's applications in sheet order, and
   `suggestedKeptLead` is the one offered as the one to keep when the reviewer
   folds them into one. It is only a suggestion: the reviewer picks, because
   whether a later row is a slip of the form or a person asking again is
   something only they can tell. */
export type DuplicateApplicant = {
  emailKey: string
  names: readonly string[]
  rowNumbers: readonly number[]
  leads: readonly Lead[]
  suggestedKeptLead: Lead
}

const RECONSIDERABLE_STATUSES: ReadonlySet<Lead['status']> = new Set(['declined', 'maybe'])

/* In this order:
   - an approved application, the earliest if there are several, because it is
     the person's membership;
   - an undecided application sent after one that was declined or kept for
     later, the newest such, because that is somebody asking again and it is
     owed a review rather than being filed away under the old answer;
   - otherwise the earliest, because it dates when they first applied. */
export const suggestKeptLead = (inSheetOrder: readonly [Lead, ...Lead[]]): Lead => {
  const approved = inSheetOrder.find((lead) => lead.status === 'approved')
  if (approved !== undefined) {
    return approved
  }
  const firstReconsiderable = inSheetOrder.findIndex((lead) =>
    RECONSIDERABLE_STATUSES.has(lead.status),
  )
  if (firstReconsiderable !== -1) {
    const askingAgain = inSheetOrder
      .slice(firstReconsiderable + 1)
      .findLast((lead) => lead.status === 'pending')
    if (askingAgain !== undefined) {
      return askingAgain
    }
  }
  return inSheetOrder[0]
}

/* Every application of the group except the one kept. */
export const selectLeadsToMark = ({
  duplicate,
  keptRowNumber,
}: {
  duplicate: DuplicateApplicant
  keptRowNumber: number
}): readonly Lead[] => duplicate.leads.filter((lead) => lead.rowNumber !== keptRowNumber)

/* Every name found is carried, not the first one: a couple and a shared work
   inbox look exactly like one person applying twice, and the differing names are
   the only thing in the sheet that tells them apart. */
const distinctNames = (leads: readonly Lead[]): readonly string[] => [
  ...new Set(leads.flatMap((lead) => (lead.name === undefined ? [] : [lead.name]))),
]

/* A blank address is not an applicant every blank row shares, so the rows that
   carry none are dropped rather than grouped under an empty key. */
const groupByEmailKey = (leads: readonly Lead[]): ReadonlyMap<string, Lead[]> =>
  leads.reduce((leadsByEmailKey, lead) => {
    const emailKey = toEmailKey(lead.email)
    if (emailKey === '') {
      return leadsByEmailKey
    }
    const alreadyGrouped = leadsByEmailKey.get(emailKey)
    if (alreadyGrouped === undefined) {
      leadsByEmailKey.set(emailKey, [lead])
    } else {
      alreadyGrouped.push(lead)
    }
    return leadsByEmailKey
  }, new Map<string, Lead[]>())

const firstRowOf = ({ rowNumbers }: DuplicateApplicant): number => Math.min(...rowNumbers)

const byMostApplications = (earlier: DuplicateApplicant, later: DuplicateApplicant): number => {
  const byApplicationCount = later.rowNumbers.length - earlier.rowNumbers.length
  if (byApplicationCount !== 0) {
    return byApplicationCount
  }
  return firstRowOf(earlier) - firstRowOf(later)
}

/* Grouped over every parsed lead rather than the waiting ones: a repeat that was
   already approved, or already sits on the Members tab, is still two rows in the
   sheet the reviewer came here to clean up. A row already marked Duplicate has
   been cleaned up, so it no longer makes a group: once all but one of an
   address's applications are marked, that address leaves the list. */
export const groupDuplicateApplicants = ({
  leads,
}: {
  leads: readonly Lead[]
}): readonly DuplicateApplicant[] =>
  [...groupByEmailKey(leads.filter((lead) => lead.status !== 'duplicate'))].flatMap(
    ([emailKey, leadsSharingEmail]) => {
      const inSheetOrder = leadsSharingEmail.toSorted(
        (earlier, later) => earlier.rowNumber - later.rowNumber,
      )
      const [first, ...rest] = inSheetOrder
      if (first === undefined || rest.length === 0) {
        return []
      }
      return [
        {
          emailKey,
          names: distinctNames(inSheetOrder),
          rowNumbers: inSheetOrder.map((lead) => lead.rowNumber),
          leads: inSheetOrder,
          suggestedKeptLead: suggestKeptLead([first, ...rest]),
        },
      ]
    },
  )
    .toSorted(byMostApplications)
