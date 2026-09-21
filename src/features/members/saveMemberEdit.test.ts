import { describe, expect, it } from 'vitest'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { buildMember } from '../../testing/memberFactory'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'
import { saveMemberEdit } from './saveMemberEdit'
import type { Member } from './member'

const columnOf = (header: string): number => MEMBERS_HEADER_ROW.indexOf(header)

const DANA_ROW = [
  'Dana Sorkin',
  'Ridgeway Systems',
  'Site Reliability Engineer',
  'F',
  'dana@example.com',
  'Yes',
  '1st',
  '0501234567',
  'Tel Aviv',
  'https://linkedin.com/in/dana',
  'AI',
  'M',
  '',
  '',
  '',
  '2024-01-01',
  '',
  '',
]

const dana = (overrides: Partial<Member> = {}): Member =>
  buildMember({
    rowNumber: 2,
    name: 'Dana Sorkin',
    company: 'Ridgeway Systems',
    title: 'Site Reliability Engineer',
    gender: 'F',
    mail: 'dana@example.com',
    informedForMembership: 'Yes',
    phone: '0501234567',
    city: 'Tel Aviv',
    linkedIn: 'https://linkedin.com/in/dana',
    interests: 'AI',
    shirtSize: 'M',
    approvedAt: '2024-01-01',
    ...overrides,
  })

const membersSheet = (rows: readonly (readonly string[])[] = [DANA_ROW]): FakeSheet =>
  createFakeSheet({ tabs: { Members: [MEMBERS_HEADER_ROW, ...rows] } })

const save = async ({
  sheet,
  changes,
  originalMember = dana(),
}: {
  sheet: FakeSheet
  changes: Partial<Member>
  originalMember?: Member
}): Promise<void> =>
  await saveMemberEdit({
    sheetsClient: sheet.client,
    originalMember,
    updatedMember: { ...originalMember, ...changes },
  })

const savedRow = (sheet: FakeSheet): readonly string[] => sheet.rowsOf('Members')[1] ?? []

describe('saveMemberEdit', () => {
  it('should write the changed cell to the sheet', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { city: 'Haifa' } })

    expect(savedRow(sheet)[columnOf('City')]).toBe('Haifa')
  })

  it('should address only the cells that changed', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { city: 'Haifa', notes: 'Speaks at meetups' } })

    expect(sheet.writes.map((write) => write.range)).toEqual(['Members!I2', 'Members!M2'])
  })

  it('should not touch the sheet at all when the edit changed nothing', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: {} })

    expect(sheet.writes).toEqual([])
  })

  it('should send values that came out of the sheet as RAW', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { phone: '0501234568' } })

    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW'])
  })

  it('should keep the leading zero on a phone number that was edited', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { phone: '0501234568' } })

    expect(savedRow(sheet)[columnOf('Phone')]).toBe('0501234568')
  })

  it('should keep a phone number the edit never touched exactly as it was', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { city: 'Haifa' } })

    expect(savedRow(sheet)[columnOf('Phone')]).toBe('0501234567')
  })

  it('should keep a dialling-code phone number from being read as arithmetic', async () => {
    const sheet = membersSheet()

    await save({ sheet, changes: { phone: '+972-50-123-4567' } })

    expect(savedRow(sheet)[columnOf('Phone')]).toBe('+972-50-123-4567')
  })

  it('should leave a formula in an untouched cell unevaluated', async () => {
    const rowWithFormula = DANA_ROW.map((cell, index) =>
      index === columnOf('Notes') ? '=COUNTIF(Attendance!A:A,E2)' : cell,
    )
    const sheet = membersSheet([rowWithFormula])

    await save({
      sheet,
      originalMember: dana({ notes: '=COUNTIF(Attendance!A:A,E2)' }),
      changes: { city: 'Haifa' },
    })

    expect(savedRow(sheet)[columnOf('Notes')]).toBe('=COUNTIF(Attendance!A:A,E2)')
  })

  it('should refuse to write when the row now holds somebody else', async () => {
    const sheet = membersSheet([DANA_ROW.map((cell) => (cell === 'Dana Sorkin' ? 'Ori Weintraub' : cell))])

    await expect(save({ sheet, changes: { city: 'Haifa' } })).rejects.toThrow(/changed while/i)
  })

  it('should write nothing when it refuses a moved row', async () => {
    const sheet = membersSheet([DANA_ROW.map((cell) => (cell === 'Dana Sorkin' ? 'Ori Weintraub' : cell))])

    await save({ sheet, changes: { city: 'Haifa' } }).catch(() => undefined)

    expect(sheet.writes).toEqual([])
  })

  it('should refuse to write when the address on the row has changed underneath the edit', async () => {
    const sheet = membersSheet([
      DANA_ROW.map((cell) => (cell === 'dana@example.com' ? 'someone.else@example.com' : cell)),
    ])

    await expect(save({ sheet, changes: { city: 'Haifa' } })).rejects.toThrow(/changed while/i)
  })

  it('should save a member whose Mail cell is blank', async () => {
    const rowWithoutMail = DANA_ROW.map((cell, index) => (index === columnOf('Mail') ? '' : cell))
    const sheet = membersSheet([rowWithoutMail])

    await save({ sheet, originalMember: dana({ mail: '' }), changes: { city: 'Haifa' } })

    expect(savedRow(sheet)[columnOf('City')]).toBe('Haifa')
  })

  it('should refuse a member with no address when the row has acquired one', async () => {
    const sheet = membersSheet()

    await expect(
      save({ sheet, originalMember: dana({ mail: '' }), changes: { city: 'Haifa' } }),
    ).rejects.toThrow(/changed while/i)
  })

  it('should say which heading is missing rather than writing to the wrong column', async () => {
    const headerWithoutCity = MEMBERS_HEADER_ROW.map((header) =>
      header === 'City' ? 'Town' : header,
    )
    const sheet = createFakeSheet({ tabs: { Members: [headerWithoutCity, DANA_ROW] } })

    await expect(save({ sheet, changes: { city: 'Haifa' } })).rejects.toThrow(/City/)
  })
})
