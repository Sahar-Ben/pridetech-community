import { toEmailKey } from '../../sheets/emailKey'
import type { Lead } from './lead'

/* `keptLead` is the application this app would keep if the reviewer folds the
   group into one: the earliest one that was approved, since that is the
   person's membership, and otherwise the earliest one, since it dates when
   they first applied. `laterLeads` are the rest, the rows that would be marked
   Duplicate. */
export type DuplicateApplicant = {
  emailKey: string
  names: readonly string[]
  rowNumbers: readonly number[]
  keptLead: Lead
  laterLeads: readonly Lead[]
}

const chooseKeptLead = (inSheetOrder: readonly [Lead, ...Lead[]]): Lead =>
  inSheetOrder.find((lead) => lead.status === 'approved') ?? inSheetOrder[0]

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
      const keptLead = chooseKeptLead([first, ...rest])
      return [
        {
          emailKey,
          names: distinctNames(inSheetOrder),
          rowNumbers: inSheetOrder.map((lead) => lead.rowNumber),
          keptLead,
          laterLeads: inSheetOrder.filter((lead) => lead !== keptLead),
        },
      ]
    },
  )
    .toSorted(byMostApplications)
