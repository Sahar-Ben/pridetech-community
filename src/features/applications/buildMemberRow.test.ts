import { describe, expect, it } from 'vitest'
import { buildMemberRow } from './buildMemberRow'
import type { Lead } from './lead'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 5,
  timestamp: '3/8/2025 14:25:20',
  name: 'Hadas Almog',
  jobTitle: 'Chief people officer',
  company: 'Cloudinary',
  linkedIn: 'https://linkedin.com/in/hadas',
  email: 'hadas.almog@cloudinary.com',
  phone: '0501234567',
  city: 'Tel Aviv',
  interests: 'AI, People',
  status: 'pending',
  ...overrides,
})

const cellUnder = ({ row, heading }: { row: readonly string[]; heading: string }): string => {
  const columnIndex = MEMBERS_HEADER_ROW.indexOf(heading)
  if (columnIndex === -1) {
    throw new Error(`the test header row has no ${heading} column`)
  }
  return row[columnIndex] ?? ''
}

const rowFor = (overrides: Partial<Lead> = {}): string[] =>
  buildMemberRow({
    lead: lead(overrides),
    gender: 'F',
    membersHeaderRow: MEMBERS_HEADER_ROW,
    approvedAt: '2026-09-21',
  })

describe('buildMemberRow', () => {
  it('should carry every field the application supplied under its own heading', () => {
    const row = rowFor()

    expect(cellUnder({ row, heading: 'Name' })).toBe('Hadas Almog')
    expect(cellUnder({ row, heading: 'Company' })).toBe('Cloudinary')
    expect(cellUnder({ row, heading: 'Title' })).toBe('Chief people officer')
    expect(cellUnder({ row, heading: 'Mail' })).toBe('hadas.almog@cloudinary.com')
    expect(cellUnder({ row, heading: 'Phone' })).toBe('0501234567')
    expect(cellUnder({ row, heading: 'City' })).toBe('Tel Aviv')
    expect(cellUnder({ row, heading: 'LinkedIn' })).toBe('https://linkedin.com/in/hadas')
    expect(cellUnder({ row, heading: 'Interests' })).toBe('AI, People')
  })

  it('should mark the new member Active and stamp when they were approved', () => {
    const row = rowFor()

    expect(cellUnder({ row, heading: 'Status' })).toBe('Active')
    expect(cellUnder({ row, heading: 'Approved at' })).toBe('2026-09-21')
  })

  it('should record the gender the reviewer chose', () => {
    expect(cellUnder({ row: rowFor(), heading: 'Gender' })).toBe('F')
  })

  it('should leave gender blank rather than guess when the reviewer chose unknown', () => {
    const row = buildMemberRow({
      lead: lead(),
      gender: 'unknown',
      membersHeaderRow: MEMBERS_HEADER_ROW,
      approvedAt: '2026-09-21',
    })

    expect(cellUnder({ row, heading: 'Gender' })).toBe('')
  })

  it('should leave the columns the application knows nothing about empty', () => {
    const row = rowFor()

    expect(cellUnder({ row, heading: 'Shirt Size' })).toBe('')
    expect(cellUnder({ row, heading: 'Notes' })).toBe('')
    expect(cellUnder({ row, heading: 'Removal reason' })).toBe('')
    expect(cellUnder({ row, heading: 'Meetup' })).toBe('')
  })

  it('should produce a row exactly as long as the header row', () => {
    expect(rowFor()).toHaveLength(MEMBERS_HEADER_ROW.length)
  })

  it('should leave a field the applicant skipped empty rather than writing undefined', () => {
    const row = rowFor({ phone: undefined, linkedIn: undefined, name: undefined })

    expect(cellUnder({ row, heading: 'Phone' })).toBe('')
    expect(cellUnder({ row, heading: 'LinkedIn' })).toBe('')
    expect(cellUnder({ row, heading: 'Name' })).toBe('')
  })

  it('should still write each value under the right heading on a reordered Members tab', () => {
    const reordered = [
      'Mail',
      'Approved at',
      'Notes',
      'Status',
      'Interests',
      'LinkedIn',
      'City',
      'Phone',
      'Gender',
      'Title',
      'Company',
      'Name',
      'Removal reason',
    ]

    const row = buildMemberRow({
      lead: lead(),
      gender: 'M',
      membersHeaderRow: reordered,
      approvedAt: '2026-09-21',
    })

    expect(row).toEqual([
      'hadas.almog@cloudinary.com',
      '2026-09-21',
      '',
      'Active',
      'AI, People',
      'https://linkedin.com/in/hadas',
      'Tel Aviv',
      '0501234567',
      'M',
      'Chief people officer',
      'Cloudinary',
      'Hadas Almog',
      '',
    ])
  })

  it('should refuse a Members tab whose Mail column was renamed, rather than append a row with no email', () => {
    const withoutMail = MEMBERS_HEADER_ROW.filter((heading) => heading !== 'Mail')

    expect(() =>
      buildMemberRow({
        lead: lead(),
        gender: 'F',
        membersHeaderRow: withoutMail,
        approvedAt: '2026-09-21',
      }),
    ).toThrow(/Mail/)
  })

  it('should refuse a Members tab whose Approved at column was renamed', () => {
    const withoutApprovedAt = MEMBERS_HEADER_ROW.filter((heading) => heading !== 'Approved at')

    expect(() =>
      buildMemberRow({
        lead: lead(),
        gender: 'F',
        membersHeaderRow: withoutApprovedAt,
        approvedAt: '2026-09-21',
      }),
    ).toThrow(/Approved at/)
  })
})
