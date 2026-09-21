import type { Member } from '../members/member'

const whitespaceRun = /\s+/g

/* Case and spacing only. `Google` and `google` are the same employer typed
   twice; `Google` and `Google Israel` are two strings this app has no honest
   way to tell apart from two genuinely different companies, so it does not try.
   Stripping `Israel`, `Ltd` or `Inc` would merge real companies quietly, which
   is worse than showing one company on two rows a reader can see and fix. */
export const toCompanyKey = (company: string): string =>
  company.trim().replace(whitespaceRun, ' ').toLowerCase()

export type CompanyGroup = {
  key: string
  label: string
  count: number
}

export type GroupedCompanies = {
  groups: readonly CompanyGroup[]
  membersWithoutCompanyCount: number
}

type SpellingCounts = Map<string, number>

const recordSpelling = ({
  spellingsByKey,
  key,
  spelling,
}: {
  spellingsByKey: Map<string, SpellingCounts>
  key: string
  spelling: string
}): void => {
  const spellings = spellingsByKey.get(key) ?? new Map<string, number>()
  spellings.set(spelling, (spellings.get(spelling) ?? 0) + 1)
  spellingsByKey.set(key, spellings)
}

/* The spelling most people used. Equally common spellings are settled by code
   point, which puts `Google` ahead of `google` and, more to the point, settles
   them the same way on every read so the chart never relabels itself. */
const mostCommonSpelling = (spellings: SpellingCounts): string =>
  [...spellings.entries()].reduce((chosen, [spelling, count]) => {
    if (count > chosen[1]) {
      return [spelling, count]
    }
    if (count === chosen[1] && spelling < chosen[0]) {
      return [spelling, count]
    }
    return chosen
  })[0]

const byCountThenName = (first: CompanyGroup, second: CompanyGroup): number => {
  if (first.count !== second.count) {
    return second.count - first.count
  }
  return first.label.toLowerCase().localeCompare(second.label.toLowerCase())
}

export const groupMembersByCompany = (members: readonly Member[]): GroupedCompanies => {
  const spellingsByKey = new Map<string, SpellingCounts>()
  const membersWithoutCompanyCount = members.filter((member) => {
    const spelling = member.company?.trim() ?? ''
    if (spelling === '') {
      return true
    }
    recordSpelling({ spellingsByKey, key: toCompanyKey(spelling), spelling })
    return false
  }).length

  const groups = [...spellingsByKey.entries()]
    .map(([key, spellings]) => ({
      key,
      label: mostCommonSpelling(spellings),
      count: [...spellings.values()].reduce((sum, count) => sum + count, 0),
    }))
    .toSorted(byCountThenName)

  return { groups, membersWithoutCompanyCount }
}
