import { describe, expect, it } from 'vitest'
import type { LeadsReviewCounts } from './leadsReview'
import {
  describeDuplicateApplicant,
  describeDuplicateNames,
  describeLeadsWithoutEmailNote,
  describeLeadWithoutEmail,
  describeMembersWithoutEmailNote,
  describeQueueCount,
  describeRepeatedEmailsNote,
  describeSharedAddressNote,
} from './leadsReviewText'

const counts = (overrides: Partial<LeadsReviewCounts> = {}): LeadsReviewCounts => ({
  waitingCount: 0,
  alreadyMemberCount: 0,
  leadsWithoutEmailCount: 0,
  membersWithoutEmailCount: 0,
  repeatedLeadEmailCount: 0,
  ...overrides,
})

describe('describeQueueCount', () => {
  it('should show what was set aside beside what is waiting, so the filter can be checked', () => {
    expect(describeQueueCount({ counts: counts({ waitingCount: 307, alreadyMemberCount: 773 }) }))
      .toBe('307 waiting \u{00b7} 773 applications from existing members')
  })

  it('should say only how many are waiting when nothing was set aside', () => {
    expect(describeQueueCount({ counts: counts({ waitingCount: 307 }) })).toBe('307 waiting')
  })

  it('should keep the sentence readable when a single person was set aside', () => {
    expect(describeQueueCount({ counts: counts({ waitingCount: 4, alreadyMemberCount: 1 }) })).toBe(
      '4 waiting \u{00b7} 1 application from an existing member',
    )
  })
})

describe('describeLeadsWithoutEmailNote', () => {
  it('should say nothing when every application carries an email', () => {
    expect(describeLeadsWithoutEmailNote({ count: 0 })).toBeUndefined()
  })

  it('should report the applications that carry no email and can never be matched', () => {
    expect(describeLeadsWithoutEmailNote({ count: 4 })).toBe(
      '4 applications have no email address, so they cannot be matched against the Members tab.',
    )
  })

  it('should keep the sentence readable for the single row a real sheet usually has', () => {
    expect(describeLeadsWithoutEmailNote({ count: 1 })).toBe(
      '1 application has no email address, so it cannot be matched against the Members tab.',
    )
  })
})

describe('describeMembersWithoutEmailNote', () => {
  it('should say nothing when every member row carries an email', () => {
    expect(describeMembersWithoutEmailNote({ count: 0 })).toBeUndefined()
  })

  it('should report the member rows with no email, since their application stays waiting', () => {
    expect(describeMembersWithoutEmailNote({ count: 3 })).toBe(
      '3 member rows have no email address, so an application from them stays in the queue.',
    )
  })

  it('should keep the sentence readable when a single member row has no email', () => {
    expect(describeMembersWithoutEmailNote({ count: 1 })).toBe(
      '1 member row has no email address, so an application from them stays in the queue.',
    )
  })
})

describe('describeRepeatedEmailsNote', () => {
  it('should say nothing when nobody applied twice', () => {
    expect(describeRepeatedEmailsNote({ count: 0 })).toBeUndefined()
  })

  it('should report the people who applied more than once', () => {
    expect(describeRepeatedEmailsNote({ count: 69 })).toBe(
      '69 email addresses appear on more than one application.',
    )
  })

  it('should keep the sentence readable when a single address repeats', () => {
    expect(describeRepeatedEmailsNote({ count: 1 })).toBe(
      '1 email address appears on more than one application.',
    )
  })
})

describe('describeLeadWithoutEmail', () => {
  it('should name the row and the applicant on it, so the right row is opened', () => {
    const description = describeLeadWithoutEmail({
      leadWithoutEmail: { rowNumber: 412, name: 'Dana Levi' },
    })

    expect(description).toBe('Leads row 412 \u{00b7} Dana Levi')
  })

  it('should give the row alone when that row has no name either', () => {
    const description = describeLeadWithoutEmail({
      leadWithoutEmail: { rowNumber: 412, name: undefined },
    })

    expect(description).toBe('Leads row 412')
  })
})

describe('describeDuplicateApplicant', () => {
  it('should name the address and every row it was entered on, so the sheet can be fixed', () => {
    const description = describeDuplicateApplicant({
      duplicate: { emailKey: 'dana@example.com', names: ['Dana Levi'], rowNumbers: [2, 9, 14] },
    })

    expect(description).toBe('dana@example.com \u{00b7} 3 applications \u{00b7} Leads rows 2, 9, 14')
  })
})

describe('describeSharedAddressNote', () => {
  it('should say nothing when every row on the address carries the same name', () => {
    expect(
      describeSharedAddressNote({
        duplicate: { emailKey: 'dana@example.com', names: ['Dana Levi'], rowNumbers: [2, 9] },
      }),
    ).toBeUndefined()
  })

  it('should warn when the rows carry different names, since an inbox may be shared', () => {
    expect(
      describeSharedAddressNote({
        duplicate: {
          emailKey: 'office@example.com',
          names: ['Dana Levi', 'Ariel Cohen'],
          rowNumbers: [2, 9],
        },
      }),
    ).toBe(
      '2 different names use this address, so these may be different people sharing an inbox rather than one person applying twice.',
    )
  })
})

describe('describeDuplicateNames', () => {
  it('should show every name on the address, so a shared inbox is not read as one person', () => {
    const names = describeDuplicateNames({
      duplicate: {
        emailKey: 'office@example.com',
        names: ['Dana Levi', 'Ariel Cohen'],
        rowNumbers: [2, 9],
      },
    })

    expect(names).toBe('Dana Levi \u{00b7} Ariel Cohen')
  })

  it('should fall back to the address when no row on it carried a name', () => {
    const names = describeDuplicateNames({
      duplicate: { emailKey: 'office@example.com', names: [], rowNumbers: [2, 9] },
    })

    expect(names).toBe('office@example.com')
  })
})
