import { describe, expect, it } from 'vitest'
import { linkEmailToMember, OTHER_EMAILS_HEADING } from './linkEmailToMember'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { buildMember } from '../../testing/memberFactory'

const HEADER = ['Name', 'Mail', 'Approved at']

const HEADER_WITH_OTHER_EMAILS = ['Name', 'Mail', 'Approved at', 'Other emails']

const dana = buildMember({
  rowNumber: 2,
  name: 'Dana Sorkin',
  mail: 'dana@example.com',
  approvedAt: '2024-01-01',
})

const DANA_ROW = ['Dana Sorkin', 'dana@example.com', '2024-01-01']

const membersSheet = (rows: readonly (readonly string[])[]): FakeSheet =>
  createFakeSheet({ tabs: { Members: rows } })

const link = async ({
  sheet,
  email = 'dana@work.example.com',
  mode,
}: {
  sheet: FakeSheet
  email?: string
  mode: 'add' | 'replace'
}): Promise<void> =>
  await linkEmailToMember({ sheetsClient: sheet.client, member: dana, email, mode })

describe('linkEmailToMember, adding another email', () => {
  it('should create the Other emails column the first time and record the address under it', async () => {
    const sheet = membersSheet([HEADER, DANA_ROW])

    await link({ sheet, mode: 'add' })

    expect(sheet.rowsOf('Members')[0]?.[3]).toBe(OTHER_EMAILS_HEADING)
    expect(sheet.rowsOf('Members')[1]).toEqual([...DANA_ROW, 'dana@work.example.com'])
  })

  it('should keep the addresses already in the cell and add the new one after them', async () => {
    const sheet = membersSheet([HEADER_WITH_OTHER_EMAILS, [...DANA_ROW, 'dana@old.example.com']])

    await link({ sheet, mode: 'add' })

    expect(sheet.rowsOf('Members')[1]?.[3]).toBe('dana@old.example.com, dana@work.example.com')
  })

  it('should leave the main address as it was', async () => {
    const sheet = membersSheet([HEADER_WITH_OTHER_EMAILS, [...DANA_ROW, '']])

    await link({ sheet, mode: 'add' })

    expect(sheet.rowsOf('Members')[1]?.[1]).toBe('dana@example.com')
  })

  it('should write nothing for an address the member already answers to', async () => {
    const sheet = membersSheet([HEADER_WITH_OTHER_EMAILS, [...DANA_ROW, 'dana@work.example.com']])

    await link({ sheet, email: ' Dana@Work.example.com ', mode: 'add' })
    await link({ sheet, email: 'DANA@example.com', mode: 'add' })

    expect(sheet.writes).toEqual([])
  })

  it('should send the address as typed, so the spreadsheet cannot reinterpret it', async () => {
    const sheet = membersSheet([HEADER, DANA_ROW])

    await link({ sheet, mode: 'add' })

    expect(sheet.writes.length).toBeGreaterThan(0)
    expect(sheet.writes.every((write) => write.valueInputOption === 'RAW')).toBe(true)
  })
})

describe('linkEmailToMember, replacing the main email', () => {
  it('should make the registered address the member\'s main one', async () => {
    const sheet = membersSheet([HEADER, DANA_ROW])

    await link({ sheet, mode: 'replace' })

    expect(sheet.rowsOf('Members')[1]).toEqual(['Dana Sorkin', 'dana@work.example.com', '2024-01-01'])
  })

  it('should not create an Other emails column', async () => {
    const sheet = membersSheet([HEADER, DANA_ROW])

    await link({ sheet, mode: 'replace' })

    expect(sheet.rowsOf('Members')[0]).toEqual(HEADER)
  })
})

describe('linkEmailToMember, when the row has moved', () => {
  it('should refuse, and write nothing, when the row no longer holds this member', async () => {
    const sheet = membersSheet([HEADER, ['Noa Levi', 'noa@example.com', '2023-05-05'], DANA_ROW])

    await expect(link({ sheet, mode: 'add' })).rejects.toThrow(/nothing was written/i)
    expect(sheet.writes).toEqual([])
  })
})
