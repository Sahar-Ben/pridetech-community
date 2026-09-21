import { describe, expect, it } from 'vitest'
import type { Lead } from './lead'
import { locateLeadStatusCell } from './locateLeadStatusCell'
import { createFakeSheet } from '../../testing/fakeSheet'
import { LEADS_HEADER_ROW, leadRow } from '../../testing/sheetsClientFactory'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 3,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const leadsTab = (rows: readonly (readonly string[])[]) => ({
  Leads: [
    LEADS_HEADER_ROW,
    leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
    ...rows,
  ],
})

const danaRow = leadRow({ name: 'Dana Maman', email: 'dana@example.com' })

describe('locateLeadStatusCell', () => {
  it('should address the Status cell on the row the application was read from', async () => {
    const sheet = createFakeSheet({ tabs: leadsTab([danaRow]) })

    expect((await locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() })).range).toBe('Leads!K3')
  })

  it('should take the Status column from the header rather than assume it is K', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          ['Status', 'E-Mail', 'Timestamp'],
          ['', 'noa@example.com', '3/8/2025 14:25:20'],
          ['', 'dana@example.com', '3/8/2025 14:25:20'],
        ],
      },
    })

    expect((await locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() })).range).toBe('Leads!A3')
  })

  it('should refuse rather than guess when the form has grown past the columns it reads', async () => {
    const wideHeader = [
      ...Array.from({ length: 26 }, (_column, index) => `Question ${index}`),
      'E-Mail',
      'Status',
    ]
    const wideRow = [...Array.from({ length: 26 }, () => ''), 'dana@example.com', '']
    const sheet = createFakeSheet({ tabs: { Leads: [wideHeader, ['', ''], wideRow] } })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/nothing was written/i)
  })

  it('should refuse to write when the row now holds somebody else', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' })]),
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/changed/i)
  })

  it('should name the applicant it expected to find, so the reviewer can see what moved', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' })]),
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/dana@example\.com/)
  })

  it('should tell the reviewer nothing was written when the row moved', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' })]),
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/nothing was written/i)
  })

  it('should accept a row whose address differs only by case, since matching ignores it', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([leadRow({ name: 'Dana Maman', email: 'Dana@Example.com' })]),
    })

    expect((await locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() })).range).toBe('Leads!K3')
  })

  it('should refuse to write when the row it was told about no longer exists', async () => {
    const sheet = createFakeSheet({ tabs: leadsTab([]) })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/changed/i)
  })

  it('should refuse to write when the Leads tab has no Status column to write into', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          ['Name', 'E-Mail', 'Timestamp'],
          ['Noa', 'noa@example.com', '3/8/2025 14:25:20'],
          ['Dana', 'dana@example.com', '3/8/2025 14:25:20'],
        ],
      },
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/Status column/i)
  })

  it('should refuse to write when the Leads tab has no email column to check against', async () => {
    const sheet = createFakeSheet({
      tabs: { Leads: [['Name', 'Status'], ['Noa', ''], ['Dana', '']] },
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/email column/i)
  })

  it('should refuse when the row now holds a second application from the same address', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          LEADS_HEADER_ROW,
          leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
          leadRow({
            name: 'Dana Maman',
            email: 'dana@example.com',
            timestamp: '3/8/2025 14:25:20',
          }),
          leadRow({
            name: 'Dana Maman',
            email: 'dana@example.com',
            timestamp: '19/8/2025 08:02:11',
          }),
        ],
      },
    })

    await expect(
      locateLeadStatusCell({
        sheetsClient: sheet.client,
        lead: lead({ rowNumber: 4, timestamp: '3/8/2025 14:25:20' }),
      }),
    ).rejects.toThrow(/changed/i)
  })

  it('should write nothing when the row it was told about carries a different submission stamp', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([leadRow({ name: 'Dana Maman', email: 'dana@example.com' })]),
    })

    await expect(
      locateLeadStatusCell({
        sheetsClient: sheet.client,
        lead: lead({ timestamp: '19/8/2025 08:02:11' }),
      }),
    ).rejects.toThrow(/nothing was written/i)
  })

  it('should accept the row whose submission stamp is the one the application was read with', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([
        leadRow({ name: 'Dana Maman', email: 'dana@example.com', timestamp: '19/8/2025 08:02:11' }),
      ]),
    })

    const statusCell = await locateLeadStatusCell({
      sheetsClient: sheet.client,
      lead: lead({ timestamp: '19/8/2025 08:02:11' }),
    })

    expect(statusCell.range).toBe('Leads!K3')
  })

  it('should refuse when the tab has no Timestamp column to check the row against', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          ['Name', 'E-Mail', 'Status'],
          ['Noa', 'noa@example.com', ''],
          ['Dana', 'dana@example.com', ''],
        ],
      },
    })

    await expect(
      locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() }),
    ).rejects.toThrow(/Timestamp column/i)
  })

  it('should report the Status the cell already holds, so a caller can tell a decided application', async () => {
    const sheet = createFakeSheet({
      tabs: leadsTab([
        leadRow({ name: 'Dana Maman', email: 'dana@example.com', status: 'Approved' }),
      ]),
    })

    const statusCell = await locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() })

    expect(statusCell.recordedStatus).toBe('Approved')
  })

  it('should read the header and the one row, not the whole tab', async () => {
    const readRanges: string[] = []
    const sheet = createFakeSheet({
      tabs: leadsTab([danaRow]),
      onRead: (range) => readRanges.push(range),
    })

    await locateLeadStatusCell({ sheetsClient: sheet.client, lead: lead() })

    expect(readRanges).toEqual(['Leads!A1:Z1', 'Leads!A3:Z3'])
  })
})
