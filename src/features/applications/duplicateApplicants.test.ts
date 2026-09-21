import { describe, expect, it } from 'vitest'
import { groupDuplicateApplicants } from './duplicateApplicants'
import type { Lead } from './lead'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: undefined,
  email: 'dana@saltedmind.co',
  phone: undefined,
  city: undefined,
  interests: undefined,
  status: 'pending',
  ...overrides,
})

describe('groupDuplicateApplicants', () => {
  it('should report an address entered on two rows with both rows, so the sheet can be fixed', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2 }), lead({ rowNumber: 9 })],
    })

    expect(duplicates).toEqual([
      { emailKey: 'dana@saltedmind.co', names: ['Dana Maman'], rowNumbers: [2, 9] },
    ])
  })

  it('should leave out an address that was entered only once', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2 }), lead({ rowNumber: 3, email: 'noa@example.com' })],
    })

    expect(duplicates).toEqual([])
  })

  it('should never group the rows that carry no email into one blank applicant', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2, email: '' }), lead({ rowNumber: 3, email: '   ' })],
    })

    expect(duplicates).toEqual([])
  })

  it('should read one address written two ways as one applicant', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [
        lead({ rowNumber: 2, email: ' Dana@SaltedMind.co ' }),
        lead({ rowNumber: 9, email: 'dana@saltedmind.co' }),
      ],
    })

    expect(duplicates.map((duplicate) => duplicate.rowNumbers)).toEqual([[2, 9]])
  })

  it('should report every distinct name on one address, since two people may share an inbox', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [
        lead({ rowNumber: 2, name: 'Dana Maman' }),
        lead({ rowNumber: 9, name: 'Ariel Cohen' }),
      ],
    })

    expect(duplicates[0]?.names).toEqual(['Dana Maman', 'Ariel Cohen'])
  })

  it('should report one name once when the same person applied twice', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2 }), lead({ rowNumber: 9 }), lead({ rowNumber: 14 })],
    })

    expect(duplicates[0]?.names).toEqual(['Dana Maman'])
  })

  it('should leave a nameless row out of the names rather than showing a gap', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2, name: undefined }), lead({ rowNumber: 9 })],
    })

    expect(duplicates[0]?.names).toEqual(['Dana Maman'])
  })

  it('should put the address with the most applications first, since it is the worst case', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [
        lead({ rowNumber: 2, email: 'twice@example.com' }),
        lead({ rowNumber: 3, email: 'twice@example.com' }),
        lead({ rowNumber: 4, email: 'thrice@example.com' }),
        lead({ rowNumber: 5, email: 'thrice@example.com' }),
        lead({ rowNumber: 6, email: 'thrice@example.com' }),
      ],
    })

    expect(duplicates.map((duplicate) => duplicate.emailKey)).toEqual([
      'thrice@example.com',
      'twice@example.com',
    ])
  })

  it('should keep two equally repeated addresses in sheet order, so the list does not shuffle', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [
        lead({ rowNumber: 8, email: 'later@example.com' }),
        lead({ rowNumber: 9, email: 'later@example.com' }),
        lead({ rowNumber: 2, email: 'earlier@example.com' }),
        lead({ rowNumber: 3, email: 'earlier@example.com' }),
      ],
    })

    expect(duplicates.map((duplicate) => duplicate.emailKey)).toEqual([
      'earlier@example.com',
      'later@example.com',
    ])
  })

  it('should list the rows of one applicant in sheet order', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 14 }), lead({ rowNumber: 2 }), lead({ rowNumber: 9 })],
    })

    expect(duplicates[0]?.rowNumbers).toEqual([2, 9, 14])
  })

  it('should count a repeat that was already decided, since the sheet still holds both rows', () => {
    const duplicates = groupDuplicateApplicants({
      leads: [lead({ rowNumber: 2, status: 'approved' }), lead({ rowNumber: 9 })],
    })

    expect(duplicates[0]?.rowNumbers).toEqual([2, 9])
  })
})
