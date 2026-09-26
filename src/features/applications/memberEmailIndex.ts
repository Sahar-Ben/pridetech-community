import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { toEmailKey } from '../../sheets/emailKey'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'

const HEADER_ROW_COUNT = 1

/* The Members `Status` cell is carried verbatim rather than parsed: this type
   exists to let a reviewer check a match by eye, and an unexpected value there is
   exactly what they need to see. `name` and `approvedAt` ride along because they
   are what a write checks the row against a second time, after the row number
   has had a chance to go stale. */
export type MemberMatch = {
  rowNumber: number
  emailKey: string
  name: string | undefined
  status: string | undefined
  removalReason: string | undefined
  approvedAt: string | undefined
}

const ACTIVE_STATUS = 'active'
const UNRECORDED_STATUS = ''

const toStatusKey = (status: string | undefined): string =>
  status?.trim().toLowerCase() ?? UNRECORDED_STATUS

/* A blank cell counts as Active, which is the opposite of what it looks like.
   `Status` was added to a Members tab that already held 787 rows, so it is
   blank on every member who joined before the column existed: blank records
   that nobody has been back to fill it in, never that somebody left. The only
   writer of `Ex-member` is this app, and it writes it the moment somebody is
   removed, so an explicit value other than Active — an ex-member, or a
   spelling nobody recognises — is the only thing on this sheet that says
   departed. Reading blank as departed put all 787 existing members back in the
   review queue, each one captioned as an ex-member coming back. */
export const isActiveMemberMatch = (member: MemberMatch): boolean => {
  const statusKey = toStatusKey(member.status)
  return statusKey === UNRECORDED_STATUS || statusKey === ACTIVE_STATUS
}

const whitespaceRun = /\s+/g

const toNameKey = (name: string | undefined): string =>
  name?.trim().replace(whitespaceRun, ' ').toLowerCase() ?? ''

/* An address on the Members tab is not proof of who is applying under it: a
   couple and a shared work inbox both look like one person applying twice, and
   `duplicateApplicants` exists because this sheet has both. The name is the only
   other thing the two records share, so a write that would otherwise be decided
   on the address alone asks this first. */
export const doesMemberMatchName = ({
  member,
  name,
}: {
  member: MemberMatch
  name: string | undefined
}): boolean => toNameKey(member.name) === toNameKey(name)

export type MemberEmailIndex = {
  matchByEmail: ReadonlyMap<string, MemberMatch>
  matchesByEmail: ReadonlyMap<string, readonly MemberMatch[]>
  membersWithoutEmailCount: number
}

type MemberColumns = {
  email: number
  name: number | undefined
  status: number | undefined
  removalReason: number | undefined
  approvedAt: number | undefined
}

const readMemberRows = ({
  dataRows,
  columns,
}: {
  dataRows: readonly (readonly string[])[]
  columns: MemberColumns
}): readonly MemberMatch[] =>
  dataRows.flatMap((row, index) => {
    const email = readCell({ row, column: columns.email })
    if (email === undefined) {
      return []
    }
    return [
      {
        rowNumber: index + HEADER_ROW_COUNT + 1,
        emailKey: toEmailKey(email),
        name: readCell({ row, column: columns.name }),
        status: readCell({ row, column: columns.status }),
        removalReason: readCell({ row, column: columns.removalReason }),
        approvedAt: readCell({ row, column: columns.approvedAt }),
      },
    ]
  })

const countRowsWithoutEmail = ({
  dataRows,
  emailColumn,
}: {
  dataRows: readonly (readonly string[])[]
  emailColumn: number
}): number =>
  dataRows.filter((row) => readCell({ row, column: emailColumn }) === undefined).length

/* Every row is kept, not the first one. The same address is on the Members tab
   more than once — an ex-member and the row somebody re-entered them on —
   and a write that asked only the first of them whether it was Active would
   reactivate an ex-member who is already Active further down, leaving one person
   on two Active rows and halving every attendance figure drawn from the address. */
const groupByEmail = (
  matches: readonly MemberMatch[],
): ReadonlyMap<string, readonly MemberMatch[]> =>
  matches.reduce((matchesByEmail, match) => {
    const alreadyGrouped = matchesByEmail.get(match.emailKey)
    if (alreadyGrouped === undefined) {
      matchesByEmail.set(match.emailKey, [match])
    } else {
      alreadyGrouped.push(match)
    }
    return matchesByEmail
  }, new Map<string, MemberMatch[]>())

/* First-row-wins, matching `buildHeaderMap`: when the same person was entered
   twice, the excluded application should point at the row they have had longest.
   This is for showing a reviewer a row to go and look at, never for deciding
   what to write — a write reads `matchesByEmail` and refuses the ambiguity. */
const firstOfEach = (
  matchesByEmail: ReadonlyMap<string, readonly MemberMatch[]>,
): ReadonlyMap<string, MemberMatch> =>
  new Map(
    [...matchesByEmail].flatMap(([emailKey, matches]) => {
      const first = matches[0]
      return first === undefined ? [] : [[emailKey, first] as const]
    }),
  )

/* Every failure here throws rather than returning an empty index: an empty index
   silently passes all ~1,000 applications through as pending, which looks exactly
   like a working queue and hides that the Members tab was never understood. */
export const buildMemberEmailIndex = ({
  rows,
}: {
  rows: readonly (readonly string[])[]
}): MemberEmailIndex => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    throw new Error('The Members tab came back empty \u{2014} it has no header row to read')
  }
  const headerMap = buildHeaderMap(headerRow)
  const emailColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.email })
  if (emailColumn === undefined) {
    throw new Error('The Members tab has no email column \u{2014} check its header row')
  }
  const matchesByEmail = groupByEmail(
    readMemberRows({
      dataRows,
      columns: {
        email: emailColumn,
        name: findColumn({ headerMap, aliases: COLUMN_ALIASES.name }),
        status: findColumn({ headerMap, aliases: COLUMN_ALIASES.status }),
        removalReason: findColumn({ headerMap, aliases: COLUMN_ALIASES.removalReason }),
        approvedAt: findColumn({ headerMap, aliases: COLUMN_ALIASES.approvedAt }),
      },
    }),
  )

  return {
    matchByEmail: firstOfEach(matchesByEmail),
    matchesByEmail,
    membersWithoutEmailCount: countRowsWithoutEmail({ dataRows, emailColumn }),
  }
}
