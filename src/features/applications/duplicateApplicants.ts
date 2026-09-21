import { toEmailKey } from '../../sheets/emailKey'
import type { Lead } from './lead'

export type DuplicateApplicant = {
  emailKey: string
  names: readonly string[]
  rowNumbers: readonly number[]
}

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
   sheet the reviewer came here to clean up. */
export const groupDuplicateApplicants = ({
  leads,
}: {
  leads: readonly Lead[]
}): readonly DuplicateApplicant[] =>
  [...groupByEmailKey(leads)]
    .filter(([, leadsSharingEmail]) => leadsSharingEmail.length > 1)
    .map(([emailKey, leadsSharingEmail]) => {
      const inSheetOrder = leadsSharingEmail.toSorted(
        (earlier, later) => earlier.rowNumber - later.rowNumber,
      )
      return {
        emailKey,
        names: distinctNames(inSheetOrder),
        rowNumbers: inSheetOrder.map((lead) => lead.rowNumber),
      }
    })
    .toSorted(byMostApplications)
