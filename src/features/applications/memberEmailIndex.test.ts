import { describe, expect, it } from 'vitest'
import { buildMemberEmailIndex, isActiveMemberMatch, type MemberMatch } from './memberEmailIndex'

const MEMBERS_HEADER_ROW = [
  'Name',
  'Company',
  'Title',
  'Gender',
  'Mail',
  'Phone',
  'Status',
  'Removal reason',
]

const memberRow = ({
  name,
  mail,
  status = 'Active',
  removalReason = '',
}: {
  name: string
  mail: string
  status?: string
  removalReason?: string
}): string[] => [
  name,
  'Cloudinary',
  'Chief People Officer',
  'F',
  mail,
  '050-000-0000',
  status,
  removalReason,
]

describe('buildMemberEmailIndex', () => {
  it('should find a member by their email and report the row they sit on', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Hadas Almog', mail: 'hadas.almog@example.com' }),
        memberRow({ name: 'Omer Gerson', mail: 'omer.gerson@example.com' }),
      ],
    })

    expect(matchByEmail.get('omer.gerson@example.com')).toEqual({
      rowNumber: 3,
      emailKey: 'omer.gerson@example.com',
      name: 'Omer Gerson',
      status: 'Active',
      removalReason: undefined,
      approvedAt: undefined,
    })
  })

  it('should find a member whose stored email differs only by case', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Hadas Almog', mail: 'Hadas.Almog@Example.com' })],
    })

    expect(matchByEmail.get('hadas.almog@example.com')?.name).toBe('Hadas Almog')
  })

  it('should find a member whose stored email is padded with whitespace', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Hadas Almog', mail: '  hadas@example.com ' })],
    })

    expect(matchByEmail.get('hadas@example.com')?.name).toBe('Hadas Almog')
  })

  it('should find a member whose stored email carries an invisible directional mark', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Hadas Almog', mail: '\u{200e}hadas@example.com\u{200f}' }),
      ],
    })

    expect(matchByEmail.get('hadas@example.com')?.name).toBe('Hadas Almog')
  })

  it('should index no email for a member row whose email cell is blank', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Nameless Address', mail: '   ' })],
    })

    expect(matchByEmail.size).toBe(0)
  })

  it('should count the member rows with no email, since their application stays in the queue', () => {
    const { membersWithoutEmailCount } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Hadas Almog', mail: 'hadas@example.com' }),
        memberRow({ name: 'No Address', mail: '' }),
        memberRow({ name: 'Also No Address', mail: '\u{200b}' }),
      ],
    })

    expect(membersWithoutEmailCount).toBe(2)
  })

  it('should keep the first member row when the same email appears twice on the tab', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Hadas Almog', mail: 'hadas@example.com' }),
        memberRow({ name: 'Hadas Almog Again', mail: 'hadas@example.com' }),
      ],
    })

    expect(matchByEmail.get('hadas@example.com')).toEqual({
      rowNumber: 2,
      emailKey: 'hadas@example.com',
      name: 'Hadas Almog',
      status: 'Active',
      removalReason: undefined,
      approvedAt: undefined,
    })
  })

  it('should report an unnamed member row rather than pretending it has a name', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [MEMBERS_HEADER_ROW, memberRow({ name: '', mail: 'hadas@example.com' })],
    })

    expect(matchByEmail.get('hadas@example.com')).toEqual({
      rowNumber: 2,
      emailKey: 'hadas@example.com',
      name: undefined,
      status: 'Active',
      removalReason: undefined,
      approvedAt: undefined,
    })
  })

  it('should carry the status of the member row, so an ex-member is not silently set aside', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Hadas Almog', mail: 'hadas@example.com', status: 'Ex-member' }),
      ],
    })

    expect(matchByEmail.get('hadas@example.com')?.status).toBe('Ex-member')
  })

  it('should leave the status undefined when the Members tab has no Status column', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [['Name', 'Mail'], ['Hadas Almog', 'hadas@example.com']],
    })

    expect(matchByEmail.get('hadas@example.com')?.status).toBeUndefined()
  })

  it('should refuse a Members tab with no email column rather than filter nothing', () => {
    expect(() =>
      buildMemberEmailIndex({ rows: [['Name', 'Company'], ['Hadas Almog', 'Cloudinary']] }),
    ).toThrow(/Members tab has no email column/i)
  })

  it('should refuse a Members tab with no header row rather than filter nothing', () => {
    expect(() => buildMemberEmailIndex({ rows: [] })).toThrow(/Members tab/i)
  })

  it('should carry why a member was removed, since a reviewer must see it before readmitting them', () => {
    const { matchByEmail } = buildMemberEmailIndex({
      rows: [
        MEMBERS_HEADER_ROW,
        memberRow({
          name: 'Hadas Almog',
          mail: 'hadas@example.com',
          status: 'Ex-member',
          removalReason: 'Code of conduct',
        }),
      ],
    })

    expect(matchByEmail.get('hadas@example.com')?.removalReason).toBe('Code of conduct')
  })
})

describe('isActiveMemberMatch', () => {
  const matchWithStatus = (status: string | undefined): MemberMatch => ({
    rowNumber: 2,
    emailKey: 'hadas@example.com',
    name: 'Hadas Almog',
    status,
    removalReason: undefined,
    approvedAt: undefined,
  })

  it('should treat a member marked Active as still a member', () => {
    expect(isActiveMemberMatch(matchWithStatus('Active'))).toBe(true)
  })

  it('should not be fooled by the casing a hand-maintained sheet uses', () => {
    expect(isActiveMemberMatch(matchWithStatus('ACTIVE'))).toBe(true)
  })

  it('should not treat an ex-member as still a member', () => {
    expect(isActiveMemberMatch(matchWithStatus('Ex-member'))).toBe(false)
  })

  it('should treat a row whose status was never filled in as still a member', () => {
    expect(isActiveMemberMatch(matchWithStatus(undefined))).toBe(true)
  })

  it('should treat a status cell holding nothing but spaces as never filled in', () => {
    expect(isActiveMemberMatch(matchWithStatus('   '))).toBe(true)
  })
})
