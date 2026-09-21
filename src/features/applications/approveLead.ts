import {
  describeAddressTakenByAnotherMember,
  describeAlreadyDecided,
  describeDuplicateMemberRows,
} from './approvalConflictText'
import { buildMemberRow } from './buildMemberRow'
import type { ApprovalDecision } from './decision'
import {
  buildMemberEmailIndex,
  doesMemberMatchName,
  isActiveMemberMatch,
  type MemberMatch,
} from './memberEmailIndex'
import { locateLeadStatusCell, type LeadStatusCell } from './locateLeadStatusCell'
import { buildMemberCellWrites } from './memberSheetColumns'
import { readVerifiedMemberRow } from './readVerifiedMemberRow'
import { buildReactivationWrites } from './reactivationWrites'
import { MEMBERS_APPEND_RANGE, MEMBERS_RANGE, MEMBERS_TAB_NAME } from './sheetTabs'
import type { SheetsClient } from '../../sheets/sheetsClient'

const APPROVED_STATUS = 'Approved'

const addMember = async ({
  sheetsClient,
  decision,
  approvedAt,
  membersHeaderRow,
}: {
  sheetsClient: SheetsClient
  decision: ApprovalDecision
  approvedAt: string
  membersHeaderRow: readonly string[]
}): Promise<void> => {
  await sheetsClient.appendRow({
    range: MEMBERS_APPEND_RANGE,
    values: buildMemberRow({
      lead: decision.lead,
      gender: decision.gender,
      membersHeaderRow,
      approvedAt,
    }),
    /* One append carries one option for the whole row, and all but three of
       these cells were read out of the Leads tab: a phone number, and any free
       text an applicant began with `=` or `+`. RAW keeps every one of them as
       typed, at the cost of `Approved at` landing as the text it reads back as
       rather than as a date value. */
    valueInputOption: 'RAW',
  })
}

/* A returning ex-member gets their old row back rather than a second one:
   attendance is matched on email, so two rows sharing an address would split one
   person's history between them and understate every count drawn from it. */
const reactivateMember = async ({
  sheetsClient,
  decision,
  approvedAt,
  existingMember,
}: {
  sheetsClient: SheetsClient
  decision: ApprovalDecision
  approvedAt: string
  existingMember: MemberMatch
}): Promise<void> => {
  const { rowNumber } = existingMember
  const { membersHeaderRow, existingRow } = await readVerifiedMemberRow({
    sheetsClient,
    expectedMember: existingMember,
  })

  const { sheetSourcedWrites, appComposedWrites } = buildReactivationWrites({
    lead: decision.lead,
    gender: decision.gender,
    membersHeaderRow,
    existingRow,
    approvedAt,
  })

  await sheetsClient.updateCells({
    writes: buildMemberCellWrites({ membersHeaderRow, rowNumber, writes: sheetSourcedWrites }),
    valueInputOption: 'RAW',
  })
  await sheetsClient.updateCells({
    writes: buildMemberCellWrites({ membersHeaderRow, rowNumber, writes: appComposedWrites }),
    valueInputOption: 'USER_ENTERED',
  })
}

/* The member row exists and is Active, so the one thing an approval still has
   to do is say so on the application. That is the state a failed status write
   leaves behind, and until now the retry insisted nothing had been written and
   sent the reviewer away. Two questions separate it from a genuine duplicate:
   an application nobody has decided still has a blank Status, and the row has
   to be the same person rather than somebody sharing the address. */
const finishApprovalOfActiveMember = async ({
  sheetsClient,
  decision,
  member,
  statusCell,
}: {
  sheetsClient: SheetsClient
  decision: ApprovalDecision
  member: MemberMatch
  statusCell: LeadStatusCell
}): Promise<void> => {
  if (statusCell.recordedStatus !== undefined) {
    throw new Error(
      describeAlreadyDecided({ member, recordedStatus: statusCell.recordedStatus }),
    )
  }
  if (!doesMemberMatchName({ member, name: decision.lead.name })) {
    throw new Error(
      describeAddressTakenByAnotherMember({ member, emailKey: decision.lead.email }),
    )
  }

  await sheetsClient.updateCell({
    range: statusCell.range,
    value: APPROVED_STATUS,
    valueInputOption: 'USER_ENTERED',
  })
}

/* The Members tab is written first and the lead's Status second, and the order
   is the whole design. There is no transaction here: if the status went first
   and the member write then failed, the applicant would be marked approved and
   appear in no member list \u{2014} invisible in both places, with nothing anywhere to
   say a person had been lost. This way round the worst case is a member row you
   can see, next to an application still sitting in the queue. */
export const approveLead = async ({
  sheetsClient,
  decision,
  approvedAt,
}: {
  sheetsClient: SheetsClient
  decision: ApprovalDecision
  approvedAt: string
}): Promise<void> => {
  const emailKey = decision.lead.email
  const membersRows = await sheetsClient.readRange({ range: MEMBERS_RANGE })
  const matches = buildMemberEmailIndex({ rows: membersRows }).matchesByEmail.get(emailKey) ?? []

  /* Every row carrying the address is consulted, not the first one: an
     ex-member above an Active row is the shape that produced two Active rows
     for one person, and the sheet is known to hold repeated addresses. */
  if (matches.length > 1) {
    throw new Error(describeDuplicateMemberRows({ emailKey, matches }))
  }

  /* Both rows are checked before either is written, so a sheet that moved under
     the reviewer costs them a reload rather than a half-finished approval. */
  const statusCell = await locateLeadStatusCell({ sheetsClient, lead: decision.lead })
  const existingMember = matches[0]

  if (existingMember !== undefined && isActiveMemberMatch(existingMember)) {
    await finishApprovalOfActiveMember({
      sheetsClient,
      decision,
      member: existingMember,
      statusCell,
    })
    return
  }

  if (existingMember === undefined) {
    const membersHeaderRow = membersRows[0]
    if (membersHeaderRow === undefined) {
      throw new Error(
        `The ${MEMBERS_TAB_NAME} tab has no header row to write under \u{2014} nothing was written.`,
      )
    }
    await addMember({ sheetsClient, decision, approvedAt, membersHeaderRow })
  } else {
    await reactivateMember({ sheetsClient, decision, approvedAt, existingMember })
  }

  await sheetsClient.updateCell({
    range: statusCell.range,
    value: APPROVED_STATUS,
    valueInputOption: 'USER_ENTERED',
  })
}
