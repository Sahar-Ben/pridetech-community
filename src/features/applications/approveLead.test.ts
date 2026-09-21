import { describe, expect, it } from 'vitest'
import { approveLead } from './approveLead'
import type { Gender } from './decision'
import type { Lead } from './lead'
import { createFakeSheet, type SheetWrite } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

const APPROVED_AT = '2026-09-21'

const dana = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 3,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050-111-1111',
  city: 'Haifa',
  interests: 'Platform',
  status: 'pending',
  ...overrides,
})

const leadsTab = [
  LEADS_HEADER_ROW,
  leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
  leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
]

const sheetWith = ({
  members = [MEMBERS_HEADER_ROW],
  leads = leadsTab,
  onWrite,
}: {
  members?: readonly (readonly string[])[]
  leads?: readonly (readonly string[])[]
  onWrite?: (write: SheetWrite) => void
} = {}) => createFakeSheet({ tabs: { Leads: leads, Members: members }, onWrite })

const approve = async ({
  sheet,
  gender = 'F',
  lead = dana(),
}: {
  sheet: ReturnType<typeof sheetWith>
  gender?: Gender
  lead?: Lead
}) =>
  await approveLead({
    sheetsClient: sheet.client,
    decision: { lead, gender },
    approvedAt: APPROVED_AT,
  })

const memberCell = ({
  row,
  heading,
}: {
  row: readonly string[]
  heading: string
}): string | undefined => row[MEMBERS_HEADER_ROW.indexOf(heading)]

const lastMemberRow = (sheet: ReturnType<typeof sheetWith>): readonly string[] => {
  const rows = sheet.rowsOf('Members')
  return rows[rows.length - 1] ?? []
}

describe('approveLead', () => {
  it('should add the member before marking the application approved', async () => {
    const sheet = sheetWith()

    await approve({ sheet })

    expect(sheet.writes.map((write) => write.kind)).toEqual(['append', 'update'])
  })

  it('should write Approved into the Status cell of that application own row', async () => {
    const sheet = sheetWith()

    await approve({ sheet })

    expect(sheet.writes[1]).toEqual({
      kind: 'update',
      range: 'Leads!K3',
      values: ['Approved'],
      valueInputOption: 'USER_ENTERED',
    })
  })

  it('should carry the application details onto the new member row', async () => {
    const sheet = sheetWith()

    await approve({ sheet })

    const row = lastMemberRow(sheet)
    expect(memberCell({ row, heading: 'Name' })).toBe('Dana Maman')
    expect(memberCell({ row, heading: 'Mail' })).toBe('dana@example.com')
    expect(memberCell({ row, heading: 'Title' })).toBe('Founder')
    expect(memberCell({ row, heading: 'Gender' })).toBe('F')
    expect(memberCell({ row, heading: 'Status' })).toBe('Active')
    expect(memberCell({ row, heading: 'Approved at' })).toBe(APPROVED_AT)
  })

  it('should not mark the application approved when adding the member fails', async () => {
    const sheet = sheetWith({
      onWrite: (write) => {
        if (write.kind === 'append') {
          throw new Error('quota exceeded')
        }
      },
    })

    await expect(approve({ sheet })).rejects.toThrow('quota exceeded')
    expect(sheet.writes.map((write) => write.kind)).toEqual(['append'])
    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('')
  })

  it('should leave the Members tab alone when the applicant already has an Active row', async () => {
    const sheet = sheetWith({
      members: [MEMBERS_HEADER_ROW, memberRow({ name: 'Dana Maman', mail: 'Dana@example.com' })],
    })

    await approve({ sheet })

    expect(sheet.rowsOf('Members')).toHaveLength(2)
    expect(sheet.writes.map((write) => write.range)).toEqual(['Leads!K3'])
  })

  it('should name the member row holding the address when it refuses', async () => {
    const sheet = sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        memberRow({ name: 'Dana Cohen', mail: 'dana@example.com' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/row 3/)
  })

  it('should store a phone number the application carries as digits, not as a number', async () => {
    const sheet = sheetWith()

    await approve({ sheet, lead: dana({ phone: '0501234567' }) })

    expect(memberCell({ row: lastMemberRow(sheet), heading: 'Phone' })).toBe('0501234567')
  })

  it('should store an international phone number the application carries without evaluating it', async () => {
    const sheet = sheetWith()

    await approve({ sheet, lead: dana({ phone: '+972-50-123-4567' }) })

    expect(memberCell({ row: lastMemberRow(sheet), heading: 'Phone' })).toBe('+972-50-123-4567')
  })

  it('should write nothing when the application row has shifted under the queue', async () => {
    const sheet = sheetWith({
      leads: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Inserted', email: 'inserted@example.com' }),
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/changed/i)
    expect(sheet.writes).toEqual([])
  })
})

describe('approveLead, for a member whose status cell was never filled in', () => {
  const unrecordedStatusSheet = ({ leadStatus = '' }: { leadStatus?: string } = {}) =>
    sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: '' }),
      ],
      leads: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com', status: leadStatus }),
      ],
    })

  it('should leave their member row alone rather than reactivate somebody who never left', async () => {
    const sheet = unrecordedStatusSheet()

    await approve({ sheet })

    expect(sheet.rowsOf('Members')).toHaveLength(2)
    expect(sheet.writes.map((write) => write.range)).toEqual(['Leads!K3'])
  })

  it('should refuse as an approval of an active member once the application carries a decision', async () => {
    const sheet = unrecordedStatusSheet({ leadStatus: 'Approved' })

    await expect(approve({ sheet })).rejects.toThrow(/already an active member/i)
    expect(sheet.writes).toEqual([])
  })
})

describe('approveLead, for somebody who was a member before', () => {
  const exMemberSheet = ({ gender = 'F', onWrite }: { gender?: string; onWrite?: (write: SheetWrite) => void } = {}) =>
    sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        memberRow({
          name: 'Dana Maman',
          mail: 'Dana@example.com',
          gender,
          status: 'Ex-member',
          removalReason: 'Moved abroad',
        }),
      ],
      onWrite,
    })

  it('should reactivate the row they already have rather than add a second one', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    expect(sheet.rowsOf('Members')).toHaveLength(3)
    expect(sheet.writes.filter((write) => write.kind === 'append')).toEqual([])
  })

  it('should bring that row back to Active and clear why they were removed', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'Status' })).toBe('Active')
    expect(memberCell({ row, heading: 'Removal reason' })).toBe('')
    expect(memberCell({ row, heading: 'Rejoined at' })).toBe(APPROVED_AT)
  })

  it('should refresh the details the new application carries', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'City' })).toBe('Haifa')
    expect(memberCell({ row, heading: 'Title' })).toBe('Founder')
  })

  it('should not overwrite a recorded gender with the unknown default', async () => {
    const sheet = exMemberSheet({ gender: 'F' })

    await approve({ sheet, gender: 'unknown' })

    expect(memberCell({ row: sheet.rowsOf('Members')[2] ?? [], heading: 'Gender' })).toBe('F')
  })

  it('should record the chosen gender when the row has none', async () => {
    const sheet = exMemberSheet({ gender: '' })

    await approve({ sheet, gender: 'M' })

    expect(memberCell({ row: sheet.rowsOf('Members')[2] ?? [], heading: 'Gender' })).toBe('M')
  })

  it('should reactivate the member before marking the application approved', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    expect(sheet.writes.map((write) => write.range)).toEqual([
      'Members!B3',
      'Members!C3',
      'Members!H3',
      'Members!I3',
      'Members!J3',
      'Members!K3',
      'Members!Q3',
      'Members!N3',
      'Members!O3',
      'Members!R3',
      'Leads!K3',
    ])
  })

  it('should send every value it read out of a cell as RAW, so Sheets stores it as it stands', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    expect(
      sheet.writes
        .filter((write) => write.valueInputOption === 'RAW')
        .map((write) => ({ range: write.range, values: write.values })),
    ).toEqual([
      { range: 'Members!B3', values: ['Salted Mind'] },
      { range: 'Members!C3', values: ['Founder'] },
      { range: 'Members!H3', values: ['050-111-1111'] },
      { range: 'Members!I3', values: ['Haifa'] },
      { range: 'Members!J3', values: ['https://linkedin.com/in/dana'] },
      { range: 'Members!K3', values: ['Platform'] },
      { range: 'Members!Q3', values: ['Moved abroad'] },
    ])
  })

  it('should send the values it composed itself as USER_ENTERED, so the date stays a date', async () => {
    const sheet = exMemberSheet()

    await approve({ sheet })

    expect(
      sheet.writes
        .filter((write) => write.valueInputOption === 'USER_ENTERED')
        .map((write) => ({ range: write.range, values: write.values })),
    ).toEqual([
      { range: 'Members!N3', values: ['Active'] },
      { range: 'Members!O3', values: [''] },
      { range: 'Members!R3', values: [APPROVED_AT] },
      { range: 'Leads!K3', values: ['Approved'] },
    ])
  })

  it('should send the gender letter the reviewer chose as USER_ENTERED, not as a sheet value', async () => {
    const sheet = exMemberSheet({ gender: '' })

    await approve({ sheet, gender: 'M' })

    expect(sheet.writes.find((write) => write.range === 'Members!D3')).toEqual({
      kind: 'update',
      range: 'Members!D3',
      values: ['M'],
      valueInputOption: 'USER_ENTERED',
    })
  })

  it('should not mark the application approved when reactivating fails', async () => {
    const sheet = exMemberSheet({
      onWrite: (write) => {
        if (write.range.startsWith('Members')) {
          throw new Error('quota exceeded')
        }
      },
    })

    await expect(approve({ sheet })).rejects.toThrow('quota exceeded')
    expect(sheet.writes.filter((write) => write.range.startsWith('Leads'))).toEqual([])
  })

  it('should write nothing when the member row has shifted under the queue', async () => {
    const sheet: ReturnType<typeof sheetWith> = createFakeSheet({
      tabs: {
        Leads: leadsTab,
        Members: [
          MEMBERS_HEADER_ROW,
          memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' }),
        ],
      },
      onRead: (range) => {
        if (range !== 'Leads!A3:Z3') {
          return
        }
        sheet.replaceRows({
          tabName: 'Members',
          rows: [
            MEMBERS_HEADER_ROW,
            memberRow({ name: 'Somebody Inserted', mail: 'inserted@example.com' }),
            memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' }),
          ],
        })
      },
    })

    await expect(approve({ sheet })).rejects.toThrow(/changed/i)
    expect(sheet.writes).toEqual([])
  })
})

describe('approveLead, reactivating a member whose row holds values the sheet must not re-parse', () => {
  const NOTES_FORMULA = '=COUNTIF(Attendance!A:A,E3)'
  const LOCALE_DATE = '03/05/2024'
  const INTERNATIONAL_PHONE = '+972-50-123-4567'

  const withCell = ({
    row,
    heading,
    value,
  }: {
    row: readonly string[]
    heading: string
    value: string
  }): string[] => {
    const cells = [...row]
    cells[MEMBERS_HEADER_ROW.indexOf(heading)] = value
    return cells
  }

  const danaExMemberRow = (): string[] => {
    const base = memberRow({
      name: 'Dana Maman',
      mail: 'dana@example.com',
      status: 'Ex-member',
      removalReason: 'Moved abroad',
    })
    const withFormula = withCell({ row: base, heading: 'Notes', value: NOTES_FORMULA })
    const withDate = withCell({
      row: withFormula,
      heading: 'Informed for membership',
      value: LOCALE_DATE,
    })
    return withCell({ row: withDate, heading: 'Phone', value: INTERNATIONAL_PHONE })
  }

  const reactivationSheet = () =>
    sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        danaExMemberRow(),
      ],
    })

  const membersRangesWrittenBy = (sheet: ReturnType<typeof sheetWith>): readonly string[] =>
    sheet.writes.filter((write) => write.range.startsWith('Members')).map((write) => write.range)

  it('should write only the cells the reactivation changes, never the whole row', async () => {
    const sheet = reactivationSheet()

    await approve({ sheet })

    expect(membersRangesWrittenBy(sheet)).toEqual([
      'Members!B3',
      'Members!C3',
      'Members!H3',
      'Members!I3',
      'Members!J3',
      'Members!K3',
      'Members!Q3',
      'Members!N3',
      'Members!O3',
      'Members!R3',
    ])
  })

  it('should leave a formula in an untouched column exactly as the sheet holds it', async () => {
    const sheet = reactivationSheet()

    await approve({ sheet })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'Notes' })).toBe(NOTES_FORMULA)
  })

  it('should leave a locale-formatted date in an untouched column with its day and month as they were', async () => {
    const sheet = reactivationSheet()

    await approve({ sheet })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'Informed for membership' })).toBe(LOCALE_DATE)
  })

  it('should keep an international phone number the application did not change', async () => {
    const sheet = reactivationSheet()

    await approve({ sheet, lead: dana({ phone: undefined }) })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'Phone' })).toBe(INTERNATIONAL_PHONE)
  })

  it('should store a phone number with a leading zero as digits rather than let Sheets read it as a number', async () => {
    const sheet = reactivationSheet()

    await approve({ sheet, lead: dana({ phone: '0501234567' }) })

    const row = sheet.rowsOf('Members')[2] ?? []
    expect(memberCell({ row, heading: 'Phone' })).toBe('0501234567')
  })
})

describe('approveLead, when the Members tab holds more than one row for the address', () => {
  const twoRowsForDana = ({ laterStatus = 'Active' }: { laterStatus?: string } = {}) =>
    sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({
          name: 'Dana Maman',
          mail: 'dana@example.com',
          status: 'Ex-member',
          removalReason: 'Moved abroad',
        }),
        memberRow({ name: 'Dana Maman', mail: 'Dana@example.com', status: laterStatus }),
      ],
    })

  it('should refuse rather than pick one of the rows to reactivate', async () => {
    await expect(approve({ sheet: twoRowsForDana() })).rejects.toThrow(/more than one/i)
  })

  it('should write nothing at all, so the sheet is not left with two Active rows', async () => {
    const sheet = twoRowsForDana()

    await expect(approve({ sheet })).rejects.toThrow(/more than one/i)

    expect(sheet.writes).toEqual([])
    expect(sheet.rowsOf('Members')).toHaveLength(3)
  })

  it('should name every row holding the address, so the reviewer can merge them', async () => {
    await expect(approve({ sheet: twoRowsForDana() })).rejects.toThrow(/rows 2 and 3/)
  })

  it('should refuse even when none of the rows is Active, since it cannot tell which is the person', async () => {
    const sheet = twoRowsForDana({ laterStatus: 'Ex-member' })

    await expect(approve({ sheet })).rejects.toThrow(/more than one/i)
    expect(sheet.writes).toEqual([])
  })
})

describe('approveLead, retrying an approval whose status write failed', () => {
  const sheetWhoseFirstStatusWriteFails = () => {
    let hasStatusWriteFailed = false
    return sheetWith({
      onWrite: (write) => {
        if (write.range.startsWith('Leads') && !hasStatusWriteFailed) {
          hasStatusWriteFailed = true
          throw new Error('quota exceeded')
        }
      },
    })
  }

  const halfWrittenSheet = async () => {
    const sheet = sheetWhoseFirstStatusWriteFails()
    await expect(approve({ sheet })).rejects.toThrow('quota exceeded')
    expect(memberCell({ row: lastMemberRow(sheet), heading: 'Status' })).toBe('Active')
    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('')
    return sheet
  }

  it('should finish the approval instead of refusing it', async () => {
    const sheet = await halfWrittenSheet()

    await approve({ sheet })

    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Approved')
  })

  it('should not add a second member row while finishing', async () => {
    const sheet = await halfWrittenSheet()

    await approve({ sheet })

    expect(sheet.rowsOf('Members')).toHaveLength(2)
  })

  it('should never claim nothing was written, because a member row already was', async () => {
    const sheet = await halfWrittenSheet()

    const failure = await approve({ sheet }).catch((caught: unknown) => caught)

    expect(String(failure)).not.toMatch(/nothing was written/i)
  })

  it('should still refuse when the address belongs to an active member who is somebody else', async () => {
    const sheet = sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Cohen', mail: 'dana@example.com', status: 'Active' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/somebody else/i)
    expect(sheet.writes).toEqual([])
  })

  it('should still refuse when the application has already been decided', async () => {
    const sheet = sheetWith({
      leads: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com', status: 'Approved' }),
      ],
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Active' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/already marked Approved/i)
    expect(sheet.writes).toEqual([])
  })
})

describe('approveLead, when a row above the application was deleted', () => {
  const FIRST_APPLICATION = '3/8/2025 14:25:20'
  const SECOND_APPLICATION = '19/8/2025 08:02:11'

  /* The reviewer read Dana's first application on row 4. Somebody then deleted a
     row above it, so row 4 now holds her second application: same name, same
     address, a different submission. */
  const sheetAfterTheDeletion = () =>
    sheetWith({
      leads: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
        leadRow({
          name: 'Dana Maman',
          email: 'dana@example.com',
          timestamp: FIRST_APPLICATION,
        }),
        leadRow({
          name: 'Dana Maman',
          email: 'dana@example.com',
          timestamp: SECOND_APPLICATION,
        }),
      ],
    })

  const danaOnRowFour = dana({ rowNumber: 4, timestamp: FIRST_APPLICATION })

  it('should abort rather than decide the application the reviewer never read', async () => {
    const sheet = sheetAfterTheDeletion()

    await expect(approve({ sheet, lead: danaOnRowFour })).rejects.toThrow(/changed/i)
  })

  it('should write nothing at all, on either tab', async () => {
    const sheet = sheetAfterTheDeletion()

    await expect(approve({ sheet, lead: danaOnRowFour })).rejects.toThrow(/changed/i)

    expect(sheet.writes).toEqual([])
    expect(sheet.rowsOf('Members')).toHaveLength(1)
    expect(sheet.rowsOf('Leads')[3]?.[10]).toBe('')
  })
})

describe('approveLead, keeping the history a rejoining member already has', () => {
  const danaReturning = ({
    removalReason = 'Code of conduct',
    membersHeaderRow = MEMBERS_HEADER_ROW,
  }: { removalReason?: string; membersHeaderRow?: readonly string[] } = {}) =>
    sheetWith({
      members: [
        membersHeaderRow,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        memberRow({
          name: 'Dana Maman',
          mail: 'dana@example.com',
          status: 'Ex-member',
          removalReason,
        }),
      ],
    })

  const reactivatedRow = (sheet: ReturnType<typeof sheetWith>): readonly string[] =>
    sheet.rowsOf('Members')[2] ?? []

  it('should keep why the member was removed, by moving it into Previous removal reason', async () => {
    const sheet = danaReturning()

    await approve({ sheet })

    expect(memberCell({ row: reactivatedRow(sheet), heading: 'Previous removal reason' })).toBe(
      'Code of conduct',
    )
  })

  it('should still clear Removal reason, since they are a member again', async () => {
    const sheet = danaReturning()

    await approve({ sheet })

    expect(memberCell({ row: reactivatedRow(sheet), heading: 'Removal reason' })).toBe('')
  })

  it('should record the approval date as Rejoined at', async () => {
    const sheet = danaReturning()

    await approve({ sheet })

    expect(memberCell({ row: reactivatedRow(sheet), heading: 'Rejoined at' })).toBe(APPROVED_AT)
  })

  it('should leave Approved at alone, because it says when they first joined', async () => {
    const sheet = danaReturning()

    await approve({ sheet })

    expect(memberCell({ row: reactivatedRow(sheet), heading: 'Approved at' })).toBe('2024-01-01')
  })

  it('should never address the Approved at cell of a rejoining member', async () => {
    const sheet = danaReturning()

    await approve({ sheet })

    expect(sheet.writes.map((write) => write.range)).not.toContain('Members!P3')
  })

  it('should carry the old reason across as a sheet value, not as something a person typed', async () => {
    const sheet = danaReturning({ removalReason: '+972-50-123-4567' })

    await approve({ sheet })

    expect(sheet.writes.find((write) => write.range === 'Members!Q3')).toEqual({
      kind: 'update',
      range: 'Members!Q3',
      values: ['+972-50-123-4567'],
      valueInputOption: 'RAW',
    })
  })

  it('should record the rejoin date as a value it composed, so it stays a date', async () => {
    const sheet = danaReturning()

    expect(sheet.writes.find((write) => write.range === 'Members!R3')).toBeUndefined()
    await approve({ sheet })

    expect(sheet.writes.find((write) => write.range === 'Members!R3')).toEqual({
      kind: 'update',
      range: 'Members!R3',
      values: [APPROVED_AT],
      valueInputOption: 'USER_ENTERED',
    })
  })

  it('should not erase a reason from an earlier removal when this one recorded none', async () => {
    const removedBeforeAndAgain = (): string[] => {
      const cells = [...memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' })]
      cells[MEMBERS_HEADER_ROW.indexOf('Previous removal reason')] = 'Code of conduct'
      return cells
    }
    const sheet = sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Someone Else', mail: 'someone@example.com' }),
        removedBeforeAndAgain(),
      ],
    })

    await approve({ sheet })

    expect(memberCell({ row: sheet.rowsOf('Members')[2] ?? [], heading: 'Previous removal reason' }))
      .toBe('Code of conduct')
  })

  it('should write no previous reason when the member row records none', async () => {
    const sheet = danaReturning({ removalReason: '' })

    await approve({ sheet })

    expect(sheet.writes.map((write) => write.range)).not.toContain('Members!Q3')
  })
})

describe('approveLead, when the Members tab has not grown the history columns yet', () => {
  const MEMBERS_HEADER_WITHOUT_HISTORY = MEMBERS_HEADER_ROW.slice(
    0,
    MEMBERS_HEADER_ROW.indexOf('Previous removal reason'),
  )

  const withoutHistoryColumns = ({
    members,
  }: {
    members: readonly (readonly string[])[]
  }) => sheetWith({ members: [MEMBERS_HEADER_WITHOUT_HISTORY, ...members] })

  it('should refuse to reactivate rather than lose the history those columns hold', async () => {
    const sheet = withoutHistoryColumns({
      members: [
        memberRow({
          name: 'Dana Maman',
          mail: 'dana@example.com',
          status: 'Ex-member',
          removalReason: 'Code of conduct',
        }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/Previous removal reason.*Rejoined at/s)
  })

  it('should say plainly that the rest of the queue still works', async () => {
    const sheet = withoutHistoryColumns({
      members: [
        memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/other applications|rest of the queue/i)
  })

  it('should write nothing at all when it refuses', async () => {
    const sheet = withoutHistoryColumns({
      members: [
        memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' }),
      ],
    })

    await expect(approve({ sheet })).rejects.toThrow(/Previous removal reason/)
    expect(sheet.writes).toEqual([])
  })

  it('should still approve a newcomer, who has no history for those columns to hold', async () => {
    const sheet = withoutHistoryColumns({ members: [] })

    await approve({ sheet })

    expect(sheet.rowsOf('Members')).toHaveLength(2)
    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Approved')
  })
})
