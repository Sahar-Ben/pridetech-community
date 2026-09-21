import { describe, expect, it } from 'vitest'
import type { MemberMatch } from './memberEmailIndex'
import { readVerifiedMemberRow } from './readVerifiedMemberRow'
import { createFakeSheet } from '../../testing/fakeSheet'
import { MEMBERS_HEADER_ROW, memberRow } from '../../testing/sheetsClientFactory'

const RECORDED_APPROVAL_DATE = '2024-01-01'

const danaRow = memberRow({
  name: 'Dana Maman',
  mail: 'dana@example.com',
  status: 'Ex-member',
  removalReason: 'Moved abroad',
})

const danaMatch = (overrides: Partial<MemberMatch> = {}): MemberMatch => ({
  rowNumber: 3,
  emailKey: 'dana@example.com',
  name: 'Dana Maman',
  status: 'Ex-member',
  removalReason: 'Moved abroad',
  approvedAt: RECORDED_APPROVAL_DATE,
  ...overrides,
})

const sheetWithDanaOnRowThree = (row: readonly string[] = danaRow) =>
  createFakeSheet({
    tabs: {
      Members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        row,
      ],
    },
  })

const readRow = async ({
  row,
  expectedMember = danaMatch(),
}: {
  row?: readonly string[]
  expectedMember?: MemberMatch
} = {}) =>
  await readVerifiedMemberRow({
    sheetsClient: sheetWithDanaOnRowThree(row).client,
    expectedMember,
  })

describe('readVerifiedMemberRow', () => {
  it('should hand back the row and the header the sheet has right now', async () => {
    const { membersHeaderRow, existingRow } = await readRow()

    expect(membersHeaderRow).toEqual(MEMBERS_HEADER_ROW)
    expect(existingRow[MEMBERS_HEADER_ROW.indexOf('Removal reason')]).toBe('Moved abroad')
    expect(existingRow[MEMBERS_HEADER_ROW.indexOf('Mail')]).toBe('dana@example.com')
  })

  it('should accept a row whose address differs only by case, since matching ignores it', async () => {
    const { existingRow } = await readRow({
      row: memberRow({
        name: 'Dana Maman',
        mail: 'Dana@Example.com',
        status: 'Ex-member',
        removalReason: 'Moved abroad',
      }),
    })

    expect(existingRow).toBeDefined()
  })

  it('should refuse when the row now holds a different address', async () => {
    await expect(
      readRow({ row: memberRow({ name: 'Ariel Cohen', mail: 'ariel@example.com' }) }),
    ).rejects.toThrow(/changed/i)
  })

  it('should refuse when the row keeps the address but names somebody else', async () => {
    await expect(
      readRow({
        row: memberRow({ name: 'Dana Cohen', mail: 'dana@example.com', status: 'Ex-member' }),
      }),
    ).rejects.toThrow(/changed/i)
  })

  it('should refuse when the row keeps the address and the name but was approved on another date', async () => {
    await expect(
      readRow({ expectedMember: danaMatch({ approvedAt: '2019-06-30' }) }),
    ).rejects.toThrow(/changed/i)
  })

  it('should tell the reviewer nothing was written when it refuses', async () => {
    await expect(
      readRow({ row: memberRow({ name: 'Ariel Cohen', mail: 'ariel@example.com' }) }),
    ).rejects.toThrow(/nothing was written/i)
  })

  it('should name the row it was looking at, so the reviewer knows where to look', async () => {
    await expect(
      readRow({ row: memberRow({ name: 'Ariel Cohen', mail: 'ariel@example.com' }) }),
    ).rejects.toThrow(/row 3/)
  })

  it('should refuse when the row it was told about no longer exists', async () => {
    const sheet = createFakeSheet({ tabs: { Members: [MEMBERS_HEADER_ROW] } })

    await expect(
      readVerifiedMemberRow({ sheetsClient: sheet.client, expectedMember: danaMatch() }),
    ).rejects.toThrow(/changed/i)
  })

  it('should refuse when the Members tab has no header row to place values by', async () => {
    const sheet = createFakeSheet({ tabs: { Members: [] } })

    await expect(
      readVerifiedMemberRow({ sheetsClient: sheet.client, expectedMember: danaMatch() }),
    ).rejects.toThrow(/no header row/i)
  })
})
