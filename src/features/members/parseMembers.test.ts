import { describe, expect, it } from 'vitest'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'
import { parseMembers } from './parseMembers'
import type { Member } from './member'

/* The real tab, column for column, so a test cannot pass against a shape the
   sheet does not have. `Meetup` sits in the middle of it and is never read. */
const HEADER_ROW = MEMBERS_HEADER_ROW

type SheetRowCells = {
  name: string
  company: string
  title: string
  gender: string
  mail: string
  informedForMembership: string
  meetup: string
  phone: string
  city: string
  linkedIn: string
  interests: string
  shirtSize: string
  notes: string
  status: string
  removalReason: string
  approvedAt: string
}

const sheetRow = ({
  name = '',
  company = '',
  title = '',
  gender = '',
  mail = '',
  informedForMembership = '',
  meetup = '',
  phone = '',
  city = '',
  linkedIn = '',
  interests = '',
  shirtSize = '',
  notes = '',
  status = '',
  removalReason = '',
  approvedAt = '',
}: Partial<SheetRowCells> = {}): string[] => [
  name,
  company,
  title,
  gender,
  mail,
  informedForMembership,
  meetup,
  phone,
  city,
  linkedIn,
  interests,
  shirtSize,
  notes,
  status,
  removalReason,
  approvedAt,
  '',
  '',
]

const parseOne = (row: readonly string[]): Member => {
  const [member] = parseMembers({ rows: [HEADER_ROW, row] })
  if (member === undefined) {
    throw new Error('the row was dropped instead of parsed')
  }
  return member
}

describe('parseMembers', () => {
  it('should read a member out of the columns the real tab uses', () => {
    const member = parseOne(
      sheetRow({
        name: 'Dana Sorkin',
        company: 'Ridgeway Systems',
        title: 'Site Reliability Engineer',
        gender: 'F',
        mail: 'dana.sorkin@example.com',
        informedForMembership: 'Yes',
        phone: '0501234567',
        city: 'Tel Aviv',
        linkedIn: 'https://linkedin.com/in/dana',
        interests: 'AI',
        shirtSize: 'M',
        notes: 'Speaks at meetups',
        status: 'Active',
        approvedAt: '2024-01-01',
      }),
    )

    expect(member).toEqual({
      rowNumber: 2,
      name: 'Dana Sorkin',
      company: 'Ridgeway Systems',
      title: 'Site Reliability Engineer',
      gender: 'F',
      mail: 'dana.sorkin@example.com',
      informedForMembership: 'Yes',
      phone: '0501234567',
      city: 'Tel Aviv',
      linkedIn: 'https://linkedin.com/in/dana',
      interests: 'AI',
      shirtSize: 'M',
      notes: 'Speaks at meetups',
      status: 'Active',
      removalReason: undefined,
      approvedAt: '2024-01-01',
    })
  })

  it('should number rows the way the sheet does, counting the header', () => {
    const members = parseMembers({
      rows: [HEADER_ROW, sheetRow({ name: 'Bet' }), sheetRow({ name: 'Alef' })],
    })

    expect(members.map((member) => ({ name: member.name, rowNumber: member.rowNumber }))).toEqual([
      { name: 'Alef', rowNumber: 3 },
      { name: 'Bet', rowNumber: 2 },
    ])
  })

  it('should read a blank Status as Active, because the column was added after everyone joined', () => {
    expect(parseOne(sheetRow({ name: 'Dana Sorkin', status: '' })).status).toBe('Active')
  })

  it('should read a recorded Ex-member as an ex-member', () => {
    const member = parseOne(
      sheetRow({ name: 'Gaya Ronen', status: 'Ex-member', removalReason: 'Moved abroad' }),
    )

    expect(member.status).toBe('Ex-member')
    expect(member.removalReason).toBe('Moved abroad')
  })

  it('should read a status nobody recognises as departed rather than as active', () => {
    expect(parseOne(sheetRow({ name: 'Gaya Ronen', status: 'Removed' })).status).toBe('Ex-member')
  })

  it('should leave an unrecorded gender unrecorded rather than guessing one', () => {
    expect(parseOne(sheetRow({ name: 'Roni Halperin', gender: '' })).gender).toBeUndefined()
  })

  it('should ignore a gender cell that is neither F nor M', () => {
    expect(parseOne(sheetRow({ name: 'Roni Halperin', gender: 'Female' })).gender).toBeUndefined()
  })

  it('should keep a row whose Mail cell is blank', () => {
    const member = parseOne(sheetRow({ name: 'Roni Halperin', mail: '' }))

    expect(member.name).toBe('Roni Halperin')
    expect(member.mail).toBe('')
  })

  it('should keep a row that has an address but no name', () => {
    const member = parseOne(sheetRow({ name: '', mail: 'roni@example.com' }))

    expect(member.name).toBe('')
    expect(member.mail).toBe('roni@example.com')
  })

  it('should never surface the legacy Meetup column', () => {
    const member = parseOne(sheetRow({ name: 'Dana Sorkin', meetup: '1st' }))

    expect(Object.values(member)).not.toContain('1st')
  })

  it('should drop a spacer row that holds nothing at all', () => {
    expect(parseMembers({ rows: [HEADER_ROW, [], sheetRow({ name: 'Dana Sorkin' })] })).toHaveLength(
      1,
    )
  })

  it('should strip the invisible formatting a hand-edited cell picks up', () => {
    expect(parseOne(sheetRow({ name: '\u{200e}Dana Sorkin ' })).name).toBe('Dana Sorkin')
  })

  it('should list members alphabetically rather than in sheet order', () => {
    const members = parseMembers({
      rows: [
        HEADER_ROW,
        sheetRow({ name: 'Zohar Amit' }),
        sheetRow({ name: '\u{5d3}\u{5e0}\u{5d4} \u{5e9}\u{5d5}\u{5e8}\u{5e7}\u{5d9}\u{5df}' }),
        sheetRow({ name: 'adi levi' }),
      ],
    })

    expect(members.map((member) => member.name)).toEqual([
      '\u{5d3}\u{5e0}\u{5d4} \u{5e9}\u{5d5}\u{5e8}\u{5e7}\u{5d9}\u{5df}',
      'adi levi',
      'Zohar Amit',
    ])
  })

  it('should refuse a tab with no header row rather than reporting an empty community', () => {
    expect(() => parseMembers({ rows: [] })).toThrow(/header row/i)
  })

  it('should refuse a tab whose Mail column has been renamed away', () => {
    const headerWithoutMail = HEADER_ROW.map((header) => (header === 'Mail' ? 'Address' : header))

    expect(() => parseMembers({ rows: [headerWithoutMail] })).toThrow(/Mail/)
  })

  it('should refuse a tab whose Name column has been renamed away', () => {
    const headerWithoutName = HEADER_ROW.map((header) => (header === 'Name' ? 'Who' : header))

    expect(() => parseMembers({ rows: [headerWithoutName] })).toThrow(/Name/)
  })

  it('should read a tab whose optional columns were never added', () => {
    const [member] = parseMembers({
      rows: [
        ['Name', 'Mail'],
        ['Dana Sorkin', 'dana@example.com'],
      ],
    })

    expect(member?.name).toBe('Dana Sorkin')
    expect(member?.city).toBeUndefined()
    expect(member?.status).toBe('Active')
  })
})
