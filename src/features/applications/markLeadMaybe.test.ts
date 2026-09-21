import { describe, expect, it } from 'vitest'
import type { Lead } from './lead'
import { markLeadMaybe } from './markLeadMaybe'
import { createFakeSheet } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
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

describe('markLeadMaybe', () => {
  it('should write the full phrase into the Status cell of that application own row', async () => {
    const sheet = sheetWith()

    await markLeadMaybe({ sheetsClient: sheet.client, decision: { lead: dana() } })

    expect(sheet.writes).toEqual([
      {
        kind: 'update',
        range: 'Leads!K3',
        values: ['Maybe in the future'],
        valueInputOption: 'USER_ENTERED',
      },
    ])
  })

  it('should add nobody to the Members tab', async () => {
    const sheet = sheetWith()

    await markLeadMaybe({ sheetsClient: sheet.client, decision: { lead: dana() } })

    expect(sheet.rowsOf('Members')).toEqual([MEMBERS_HEADER_ROW])
  })

  it('should leave a prior member row exactly as it was', async () => {
    const existingRow = memberRow({
      name: 'Dana Maman',
      mail: 'dana@example.com',
      status: 'Ex-member',
    })
    const sheet = sheetWith({ members: [MEMBERS_HEADER_ROW, existingRow] })

    await markLeadMaybe({ sheetsClient: sheet.client, decision: { lead: dana() } })

    expect(sheet.rowsOf('Members')).toEqual([MEMBERS_HEADER_ROW, existingRow])
  })

  it('should refuse to write when the row has moved under the reviewer', async () => {
    const sheet = sheetWith({
      leads: [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
    })

    await expect(
      markLeadMaybe({ sheetsClient: sheet.client, decision: { lead: dana() } }),
    ).rejects.toThrow()
    expect(sheet.writes).toEqual([])
  })
})
