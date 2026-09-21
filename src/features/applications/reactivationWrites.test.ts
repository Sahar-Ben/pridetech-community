import { describe, expect, it } from 'vitest'
import type { Gender } from './decision'
import type { Lead } from './lead'
import { buildReactivationWrites } from './reactivationWrites'
import type { MemberCellWrite, MemberColumnTarget } from './memberSheetColumns'

const APPROVED_AT = '2026-09-21'

const MEMBERS_HEADER_ROW = [
  'Name',
  'Company',
  'Title',
  'Gender',
  'Mail',
  'Notes',
  'Phone',
  'City',
  'LinkedIn',
  'Interests',
  'Status',
  'Removal reason',
  'Approved at',
  'Previous removal reason',
  'Rejoined at',
]

const existingDanaRow = [
  'Dana Maman',
  'Meadowlark Labs',
  'Backend Engineer',
  'F',
  'dana@example.com',
  '=COUNTIF(Attendance!A:A,E2)',
  '+972-50-123-4567',
  'Tel Aviv',
  'https://linkedin.com/in/old',
  'AI',
  'Ex-member',
  'Moved abroad',
  '2024-01-01',
  '',
  '',
]

/* The three tests about refreshing application fields use a row with nothing
   recorded against it, so the only writes they can see are the ones they are
   about: a row that does carry a removal reason also writes it to history. */
const rowNobodyWasRemovedFrom = existingDanaRow.map((cell) =>
  cell === 'Moved abroad' ? '' : cell,
)

const dana = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 3,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Backend Engineer',
  company: 'Meadowlark Labs',
  linkedIn: 'https://linkedin.com/in/old',
  email: 'dana@example.com',
  phone: '+972-50-123-4567',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const buildWrites = ({
  lead = dana(),
  gender = 'unknown',
  existingRow = existingDanaRow,
}: {
  lead?: Lead
  gender?: Gender
  existingRow?: readonly string[]
} = {}) =>
  buildReactivationWrites({
    lead,
    gender,
    membersHeaderRow: MEMBERS_HEADER_ROW,
    existingRow,
    approvedAt: APPROVED_AT,
  })

const targetsOf = (writes: readonly MemberCellWrite[]): readonly MemberColumnTarget[] =>
  writes.map((write) => write.target)

const valueFor = ({
  writes,
  target,
}: {
  writes: readonly MemberCellWrite[]
  target: MemberColumnTarget
}): string | undefined => writes.find((write) => write.target === target)?.value

describe('buildReactivationWrites', () => {
  it('should write nothing for a field the application repeats unchanged', () => {
    const { sheetSourcedWrites } = buildWrites({ existingRow: rowNobodyWasRemovedFrom })

    expect(sheetSourcedWrites).toEqual([])
  })

  it('should write only the fields the new application actually changes', () => {
    const { sheetSourcedWrites } = buildWrites({
      lead: dana({ city: 'Haifa', jobTitle: 'Founder' }),
      existingRow: rowNobodyWasRemovedFrom,
    })

    expect(targetsOf(sheetSourcedWrites)).toEqual(['title', 'city'])
  })

  it('should keep what the sheet holds for a field the new application left blank', () => {
    const { sheetSourcedWrites } = buildWrites({
      lead: dana({ phone: undefined }),
      existingRow: rowNobodyWasRemovedFrom,
    })

    expect(targetsOf(sheetSourcedWrites)).toEqual([])
  })

  it('should count the application own fields as sourced from the sheet, since they were read from one', () => {
    const { sheetSourcedWrites, appComposedWrites } = buildWrites({
      lead: dana({ phone: '0501234567' }),
    })

    expect(valueFor({ writes: sheetSourcedWrites, target: 'phone' })).toBe('0501234567')
    expect(targetsOf(appComposedWrites)).not.toContain('phone')
  })

  it('should bring the row back to Active as a value it composed itself', () => {
    const { appComposedWrites } = buildWrites()

    expect(valueFor({ writes: appComposedWrites, target: 'status' })).toBe('Active')
  })

  it('should clear why the member was removed', () => {
    const { appComposedWrites } = buildWrites()

    expect(valueFor({ writes: appComposedWrites, target: 'removalReason' })).toBe('')
  })

  it('should not clear a removal reason cell that is already blank', () => {
    const { appComposedWrites } = buildWrites({ existingRow: rowNobodyWasRemovedFrom })

    expect(targetsOf(appComposedWrites)).not.toContain('removalReason')
  })

  it('should not erase a reason from an earlier removal when this one recorded none', () => {
    const removedTwiceSecondTimeWithoutAReason = [
      ...rowNobodyWasRemovedFrom.slice(0, 13),
      'Code of conduct',
      ...rowNobodyWasRemovedFrom.slice(14),
    ]

    const { sheetSourcedWrites } = buildWrites({
      existingRow: removedTwiceSecondTimeWithoutAReason,
    })

    expect(targetsOf(sheetSourcedWrites)).not.toContain('previousRemovalReason')
  })

  it('should carry no previous reason across when nobody ever removed them', () => {
    const { sheetSourcedWrites } = buildWrites({ existingRow: rowNobodyWasRemovedFrom })

    expect(targetsOf(sheetSourcedWrites)).not.toContain('previousRemovalReason')
  })

  it('should stamp the approval date as the date they rejoined', () => {
    const { appComposedWrites } = buildWrites()

    expect(valueFor({ writes: appComposedWrites, target: 'rejoinedAt' })).toBe(APPROVED_AT)
  })

  it('should leave the original joining date alone, since a rejoin does not change it', () => {
    const { appComposedWrites, sheetSourcedWrites } = buildWrites()

    expect(targetsOf([...appComposedWrites, ...sheetSourcedWrites])).not.toContain('approvedAt')
  })

  it('should carry the reason they were removed into Previous removal reason', () => {
    const { sheetSourcedWrites } = buildWrites()

    expect(valueFor({ writes: sheetSourcedWrites, target: 'previousRemovalReason' })).toBe(
      'Moved abroad',
    )
  })

  it('should refuse to build a reactivation at all when the history columns are absent', () => {
    expect(() =>
      buildReactivationWrites({
        lead: dana(),
        gender: 'unknown',
        membersHeaderRow: MEMBERS_HEADER_ROW.slice(0, -2),
        existingRow: existingDanaRow,
        approvedAt: APPROVED_AT,
      }),
    ).toThrow(/Previous removal reason/)
  })

  it('should not overwrite a recorded gender with the unknown default', () => {
    const { appComposedWrites, sheetSourcedWrites } = buildWrites({ gender: 'unknown' })

    expect(targetsOf([...appComposedWrites, ...sheetSourcedWrites])).not.toContain('gender')
  })

  it('should not overwrite a recorded gender with a different letter the reviewer chose', () => {
    const { appComposedWrites } = buildWrites({ gender: 'M' })

    expect(targetsOf(appComposedWrites)).not.toContain('gender')
  })

  it('should record the letter the reviewer chose when the row has no gender', () => {
    const { appComposedWrites } = buildWrites({
      gender: 'M',
      existingRow: [...existingDanaRow.slice(0, 3), '', ...existingDanaRow.slice(4)],
    })

    expect(valueFor({ writes: appComposedWrites, target: 'gender' })).toBe('M')
  })

  it('should never name the cells it was not asked about, whatever they hold', () => {
    const { sheetSourcedWrites, appComposedWrites } = buildWrites({
      lead: dana({ city: 'Haifa' }),
    })

    expect(targetsOf([...sheetSourcedWrites, ...appComposedWrites])).not.toContain('mail')
  })
})
