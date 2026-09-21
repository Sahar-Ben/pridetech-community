import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'
import { buildMemberEditWrites } from './memberEditWrites'
import type { Member } from './member'
import type { MemberCellWrite } from '../applications/memberSheetColumns'

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

const writesFor = ({
  changes,
  existingRow = DANA_ROW,
  originalMember = dana(),
}: {
  changes: Partial<Member>
  existingRow?: readonly string[]
  originalMember?: Member
}): readonly MemberCellWrite[] =>
  buildMemberEditWrites({
    originalMember,
    updatedMember: { ...originalMember, ...changes },
    membersHeaderRow: MEMBERS_HEADER_ROW,
    existingRow,
  })

describe('buildMemberEditWrites', () => {
  it('should write nothing when the edit changed nothing', () => {
    expect(writesFor({ changes: {} })).toEqual([])
  })

  it('should write only the field that changed', () => {
    expect(writesFor({ changes: { city: 'Haifa' } })).toEqual([{ target: 'city', value: 'Haifa' }])
  })

  it('should leave a phone number alone when the edit was about something else', () => {
    const targets = writesFor({ changes: { city: 'Haifa' } }).map((write) => write.target)

    expect(targets).not.toContain('phone')
  })

  it('should write a field the edit emptied', () => {
    expect(writesFor({ changes: { city: undefined } })).toEqual([{ target: 'city', value: '' }])
  })

  it('should fill in a field that was never recorded', () => {
    expect(writesFor({ changes: { notes: 'Speaks at meetups' } })).toEqual([
      { target: 'notes', value: 'Speaks at meetups' },
    ])
  })

  it('should not rewrite a blank Status cell when the status was left alone', () => {
    const targets = writesFor({ changes: { city: 'Haifa' } }).map((write) => write.target)

    expect(targets).not.toContain('status')
  })

  it('should record the status and the reason when a member is removed', () => {
    expect(
      writesFor({ changes: { status: 'Ex-member', removalReason: 'Moved abroad' } }),
    ).toEqual([
      { target: 'status', value: 'Ex-member' },
      { target: 'removalReason', value: 'Moved abroad' },
    ])
  })

  it('should clear the removal reason when a member becomes active again', () => {
    const formerMember = dana({ status: 'Ex-member', removalReason: 'Moved abroad' })
    const rowOfFormerMember = DANA_ROW.map((cell, index) => {
      if (index === MEMBERS_HEADER_ROW.indexOf('Status')) {
        return 'Ex-member'
      }
      return index === MEMBERS_HEADER_ROW.indexOf('Removal reason') ? 'Moved abroad' : cell
    })

    expect(
      writesFor({
        originalMember: formerMember,
        existingRow: rowOfFormerMember,
        changes: { status: 'Active', removalReason: undefined },
      }),
    ).toEqual([
      { target: 'status', value: 'Active' },
      { target: 'removalReason', value: '' },
    ])
  })

  it('should never write the columns the approval flow owns', () => {
    const targets = writesFor({
      changes: { status: 'Ex-member', removalReason: 'Left tech', city: 'Haifa' },
    }).map((write) => write.target)

    expect(targets).not.toContain('approvedAt')
    expect(targets).not.toContain('previousRemovalReason')
    expect(targets).not.toContain('rejoinedAt')
  })

  it('should write a new address when the email is changed', () => {
    expect(writesFor({ changes: { mail: 'dana.sorkin@example.com' } })).toEqual([
      { target: 'mail', value: 'dana.sorkin@example.com' },
    ])
  })

  it('should give a member with no recorded address one', () => {
    const rowWithoutMail = DANA_ROW.map((cell, index) =>
      index === MEMBERS_HEADER_ROW.indexOf('Mail') ? '' : cell,
    )

    expect(
      writesFor({
        originalMember: dana({ mail: '' }),
        existingRow: rowWithoutMail,
        changes: { mail: 'dana@example.com' },
      }),
    ).toEqual([{ target: 'mail', value: 'dana@example.com' }])
  })

  it('should not rewrite a cell that already says what the edit would put in it', () => {
    const rowAnotherOrganiserAlreadyMoved = DANA_ROW.map((cell, index) =>
      index === MEMBERS_HEADER_ROW.indexOf('City') ? 'Haifa' : cell,
    )

    expect(
      writesFor({ existingRow: rowAnotherOrganiserAlreadyMoved, changes: { city: 'Haifa' } }),
    ).toEqual([])
  })

  it('should not rewrite a cell whose only difference is padding the sheet keeps', () => {
    const paddedRow = DANA_ROW.map((cell, index) =>
      index === MEMBERS_HEADER_ROW.indexOf('City') ? ' Haifa ' : cell,
    )

    expect(writesFor({ existingRow: paddedRow, changes: { city: 'Haifa' } })).toEqual([])
  })
})
