import { describe, expect, it, vi } from 'vitest'
import { declineLead } from './declineLead'
import type { Lead } from './lead'
import { createFakeSheet } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  LEADS_HEADER_ROW_WITH_REASON,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

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

const sheetWith = ({
  leads = [
    LEADS_HEADER_ROW,
    leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
    leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
  ],
  members = [MEMBERS_HEADER_ROW],
}: {
  leads?: readonly (readonly string[])[]
  members?: readonly (readonly string[])[]
} = {}) => createFakeSheet({ tabs: { Leads: leads, Members: members } })

describe('declineLead', () => {
  it('should write Declined into the Status cell of that application own row', async () => {
    const sheet = sheetWith()

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(sheet.writes).toEqual([
      { kind: 'update', range: 'Leads!K3', values: ['Declined'], valueInputOption: 'RAW' },
    ])
  })

  it('should write the reason beside the status, in the one request the status goes in', async () => {
    const sheet = sheetWith({
      leads: [
        LEADS_HEADER_ROW_WITH_REASON,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
      ],
    })

    await declineLead({
      sheetsClient: sheet.client,
      decision: { lead: dana(), reason: 'Not in Tech' },
    })

    expect(vi.mocked(sheet.client.updateCells).mock.calls).toEqual([
      [
        {
          writes: [
            { range: 'Leads!K3', value: 'Declined' },
            { range: 'Leads!L3', value: 'Not in Tech' },
          ],
          valueInputOption: 'RAW',
        },
      ],
    ])
  })

  it('should leave the reason cell alone when the reviewer skipped the reason', async () => {
    const sheet = sheetWith({
      leads: [
        LEADS_HEADER_ROW_WITH_REASON,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
      ],
    })

    await declineLead({
      sheetsClient: sheet.client,
      decision: { lead: dana(), reason: undefined },
    })

    expect(sheet.writes.map((write) => write.range)).toEqual(['Leads!K3'])
  })

  it('should store a reason that begins with = as the text the reviewer typed', async () => {
    const sheet = sheetWith({
      leads: [
        LEADS_HEADER_ROW_WITH_REASON,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
      ],
    })

    await declineLead({
      sheetsClient: sheet.client,
      decision: { lead: dana(), reason: '=SUM(A:A)' },
    })

    expect(sheet.rowsOf('Leads')[2]?.[11]).toBe('=SUM(A:A)')
    /* The option is asserted as well as the stored text because the fake can
       model what Google does to a number or a date, and cannot model what it
       does to a formula: under USER_ENTERED the reviewer's sentence would come
       back as whatever the formula evaluated to. */
    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW', 'RAW'])
  })

  it('should refuse the whole decision when there is no Reason column to hold the reason', async () => {
    const sheet = sheetWith()

    await expect(
      declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: 'Not in Tech' } }),
    ).rejects.toThrow(/Reason column/i)
    expect(sheet.writes).toEqual([])
  })

  it('should still decline when there is no Reason column and no reason was given', async () => {
    const sheet = sheetWith()

    await declineLead({
      sheetsClient: sheet.client,
      decision: { lead: dana(), reason: undefined },
    })

    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Declined')
  })

  it('should add nobody to the Members tab', async () => {
    const sheet = sheetWith()

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(sheet.rowsOf('Members')).toEqual([MEMBERS_HEADER_ROW])
  })

  it('should add nobody to the Members tab even for somebody who was a member before', async () => {
    const sheet = sheetWith({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Maman', mail: 'dana@example.com', status: 'Ex-member' }),
      ],
    })

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(sheet.writes.map((write) => write.range)).toEqual(['Leads!K3'])
  })

  it('should leave an ex-member row exactly as it was', async () => {
    const existing = memberRow({
      name: 'Dana Maman',
      mail: 'dana@example.com',
      status: 'Ex-member',
      removalReason: 'Moved abroad',
    })
    const sheet = sheetWith({ members: [MEMBERS_HEADER_ROW, existing] })

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(sheet.rowsOf('Members')[1]).toEqual(existing)
  })

  it('should take the Status column from the header rather than assume it is K', async () => {
    const sheet = sheetWith({
      leads: [
        ['Status', 'E-Mail', 'Timestamp'],
        ['', 'noa@example.com', '3/8/2025 14:25:20'],
        ['', 'dana@example.com', '3/8/2025 14:25:20'],
      ],
    })

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(sheet.writes.map((write) => write.range)).toEqual(['Leads!A3'])
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

    await expect(
      declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } }),
    ).rejects.toThrow(/changed/i)
    expect(sheet.writes).toEqual([])
  })

  it('should never read the Members tab, since declining has nothing to do with it', async () => {
    const readRanges: string[] = []
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          LEADS_HEADER_ROW,
          leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
          leadRow({ name: 'Dana Maman', email: 'dana@example.com' }),
        ],
        Members: [MEMBERS_HEADER_ROW],
      },
      onRead: (range) => readRanges.push(range),
    })

    await declineLead({ sheetsClient: sheet.client, decision: { lead: dana(), reason: undefined } })

    expect(readRanges.filter((range) => range.startsWith('Members'))).toEqual([])
  })
})
