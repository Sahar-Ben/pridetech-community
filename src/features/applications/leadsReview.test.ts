import { describe, expect, it } from 'vitest'
import { buildLeadsReview, type LeadsReview } from './leadsReview'
import type { Lead, LeadStatus } from './lead'
import { buildMemberEmailIndex } from './memberEmailIndex'

const MEMBERS_HEADER_ROW = ['Name', 'Company', 'Mail', 'Status', 'Removal reason']

const memberIndexOf = (memberRows: readonly string[][]) =>
  buildMemberEmailIndex({ rows: [MEMBERS_HEADER_ROW, ...memberRows] })

const activeMember = ({ name, mail }: { name: string; mail: string }): string[] => [
  name,
  'Salted Mind',
  mail,
  'Active',
  '',
]

const exMember = ({
  name,
  mail,
  removalReason = '',
}: {
  name: string
  mail: string
  removalReason?: string
}): string[] => [name, 'Salted Mind', mail, 'Ex-member', removalReason]

/* What all 787 rows that predate the Status column look like: an address, and a
   Status cell nobody has been back to fill in. */
const memberWithUnrecordedStatus = ({
  name,
  mail,
  status = '',
}: {
  name: string
  mail: string
  status?: string
}): string[] => [name, 'Salted Mind', mail, status, '']

const waitingEmails = (review: LeadsReview): readonly string[] =>
  review.waitingApplications.map((waiting) => waiting.lead.email)

const lead = ({
  rowNumber = 2,
  name = 'Dana Maman',
  email = 'dana@example.com',
  status = 'pending',
}: {
  rowNumber?: number
  name?: string
  email?: string
  status?: LeadStatus
} = {}): Lead => ({
  rowNumber,
  timestamp: '3/8/2025 14:25:20',
  name,
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email,
  phone: '050-000-0000',
  city: 'Tel Aviv',
  interests: 'AI',
  status,
})

const reviewOf = ({
  leads,
  memberRows = [],
  rowsWithoutEmail = [],
}: {
  leads: readonly Lead[]
  memberRows?: readonly string[][]
  rowsWithoutEmail?: readonly { rowNumber: number; name: string | undefined }[]
}) =>
  buildLeadsReview({
    parsedLeads: { leads, rowsWithoutEmail },
    memberEmailIndex: memberIndexOf(memberRows),
  })

describe('buildLeadsReview', () => {
  it('should keep a pending application waiting when no member has that email', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [activeMember({ name: 'Someone Else', mail: 'someone@example.com' })],
    })

    expect(waitingEmails(review)).toEqual(['dana@example.com'])
    expect(review.alreadyMemberLeads).toEqual([])
  })

  it('should take a pending application out of the queue when its email is already a member', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(review.waitingApplications).toEqual([])
    expect(review.alreadyMemberLeads.map((excluded) => excluded.lead.email)).toEqual([
      'dana@example.com',
    ])
  })

  it('should name the member row that excluded the application, so it can be checked', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [
        activeMember({ name: 'Someone Else', mail: 'someone@example.com' }),
        activeMember({ name: 'Dana Maman', mail: 'dana@example.com' }),
      ],
    })

    expect(review.alreadyMemberLeads[0]?.member).toEqual({
      rowNumber: 3,
      emailKey: 'dana@example.com',
      name: 'Dana Maman',
      status: 'Active',
      removalReason: undefined,
      approvedAt: undefined,
    })
  })

  it('should match a member whose email was typed in a different case', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: 'DANA@Example.com' })],
    })

    expect(review.waitingApplications).toEqual([])
  })

  it('should match a member whose email was typed with stray whitespace', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: '  dana@example.com  ' })],
    })

    expect(review.waitingApplications).toEqual([])
  })

  it('should never match an application against a member row that has no email', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: '' })],
    })

    expect(waitingEmails(review)).toEqual(['dana@example.com'])
    expect(review.counts.membersWithoutEmailCount).toBe(1)
  })

  it('should leave an application already marked approved out of both lists', () => {
    const review = reviewOf({
      leads: [lead({ name: 'Decided', status: 'approved' })],
    })

    expect(review.waitingApplications).toEqual([])
    expect(review.alreadyMemberLeads).toEqual([])
  })

  it('should leave an application already marked declined out of both lists', () => {
    const review = reviewOf({
      leads: [lead({ name: 'Decided', status: 'declined' })],
    })

    expect(review.waitingApplications).toEqual([])
    expect(review.alreadyMemberLeads).toEqual([])
  })

  it('should show the application that has waited longest first', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 9, name: 'Newer', email: 'newer@example.com' }),
        lead({ rowNumber: 2, name: 'Older', email: 'older@example.com' }),
      ],
    })

    expect(review.waitingApplications.map((waiting) => waiting.lead.name)).toEqual([
      'Older',
      'Newer',
    ])
  })

  it('should list the excluded applications in sheet order too', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 9, name: 'Newer', email: 'newer@example.com' }),
        lead({ rowNumber: 2, name: 'Older', email: 'older@example.com' }),
      ],
      memberRows: [
        activeMember({ name: 'Newer', mail: 'newer@example.com' }),
        activeMember({ name: 'Older', mail: 'older@example.com' }),
      ],
    })

    expect(review.alreadyMemberLeads.map((excluded) => excluded.lead.name)).toEqual([
      'Older',
      'Newer',
    ])
  })

  it('should count what it decided, so the two numbers can be checked against the sheet', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'member@example.com' }),
        lead({ rowNumber: 3, email: 'waiting@example.com' }),
        lead({ rowNumber: 4, email: 'other@example.com' }),
      ],
      memberRows: [activeMember({ name: 'Member', mail: 'member@example.com' })],
    })

    expect(review.counts.waitingCount).toBe(2)
    expect(review.counts.alreadyMemberCount).toBe(1)
  })

  it('should count the applications that carry no email at all', () => {
    const review = reviewOf({
      leads: [lead()],
      rowsWithoutEmail: [
        { rowNumber: 5, name: 'Nameless' },
        { rowNumber: 8, name: undefined },
      ],
    })

    expect(review.counts.leadsWithoutEmailCount).toBe(2)
  })

  it('should carry the rows that have no email, so each can be opened in the sheet', () => {
    const review = reviewOf({
      leads: [lead()],
      rowsWithoutEmail: [{ rowNumber: 5, name: 'Nameless' }],
    })

    expect(review.leadsWithoutEmail).toEqual([{ rowNumber: 5, name: 'Nameless' }])
  })

  it('should count each email that appears on more than one application once', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'twice@example.com' }),
        lead({ rowNumber: 3, email: 'twice@example.com' }),
        lead({ rowNumber: 4, email: 'thrice@example.com' }),
        lead({ rowNumber: 5, email: 'thrice@example.com' }),
        lead({ rowNumber: 6, email: 'thrice@example.com' }),
        lead({ rowNumber: 7, email: 'once@example.com' }),
      ],
    })

    expect(review.counts.repeatedLeadEmailCount).toBe(2)
  })

  it('should count a repeated email even when one of the two was already decided', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'twice@example.com', status: 'approved' }),
        lead({ rowNumber: 3, email: 'twice@example.com' }),
      ],
    })

    expect(review.counts.repeatedLeadEmailCount).toBe(1)
  })

  it('should report nothing waiting and nothing excluded for an empty Leads tab', () => {
    const review = reviewOf({ leads: [] })

    expect(review.counts).toEqual({
      waitingCount: 0,
      alreadyMemberCount: 0,
      declinedCount: 0,
      leadsWithoutEmailCount: 0,
      membersWithoutEmailCount: 0,
      repeatedLeadEmailCount: 0,
    })
  })

  it('should list the repeated addresses themselves, not only how many there are', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, name: 'Dana Maman', email: 'twice@example.com' }),
        lead({ rowNumber: 3, name: 'Dana Maman', email: 'twice@example.com' }),
        lead({ rowNumber: 4, email: 'once@example.com' }),
      ],
    })

    expect(review.duplicateApplicants).toEqual([
      { emailKey: 'twice@example.com', names: ['Dana Maman'], rowNumbers: [2, 3] },
    ])
  })

  it('should list a repeat whose email is already on the Members tab, since the sheet still repeats', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'member@example.com' }),
        lead({ rowNumber: 3, email: 'member@example.com' }),
      ],
      memberRows: [activeMember({ name: 'Member', mail: 'member@example.com' })],
    })

    expect(review.waitingApplications).toEqual([])
    expect(review.duplicateApplicants.map((duplicate) => duplicate.rowNumbers)).toEqual([[2, 3]])
  })

  it('should list a repeat whose rows were already decided, since they still clutter the sheet', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'twice@example.com', status: 'approved' }),
        lead({ rowNumber: 3, email: 'twice@example.com', status: 'declined' }),
      ],
    })

    expect(review.duplicateApplicants.map((duplicate) => duplicate.rowNumbers)).toEqual([[2, 3]])
  })
  it('should keep an application in the queue when the matching member is an ex-member', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [exMember({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(waitingEmails(review)).toEqual(['dana@example.com'])
    expect(review.alreadyMemberLeads).toEqual([])
  })

  it('should tell the reviewer which member row a returning applicant already has', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [
        exMember({
          name: 'Dana Maman',
          mail: 'dana@example.com',
          removalReason: 'Code of conduct',
        }),
      ],
    })

    expect(review.waitingApplications[0]?.priorMember).toEqual({
      rowNumber: 2,
      emailKey: 'dana@example.com',
      name: 'Dana Maman',
      status: 'Ex-member',
      removalReason: 'Code of conduct',
      approvedAt: undefined,
    })
  })

  it('should carry no prior member for an applicant the Members tab has never seen', () => {
    const review = reviewOf({ leads: [lead({ email: 'dana@example.com' })] })

    expect(review.waitingApplications[0]?.priorMember).toBeUndefined()
  })

  it('should take an application out of the queue when the matching member row has a blank status', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [memberWithUnrecordedStatus({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(review.waitingApplications).toEqual([])
    expect(review.alreadyMemberLeads.map((excluded) => excluded.lead.email)).toEqual([
      'dana@example.com',
    ])
  })

  it('should take it out of the queue when that status cell holds nothing but spaces', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [
        memberWithUnrecordedStatus({
          name: 'Dana Maman',
          mail: 'dana@example.com',
          status: '   ',
        }),
      ],
    })

    expect(waitingEmails(review)).toEqual([])
  })

  it('should count a returning ex-member as waiting, since a reviewer still has to decide', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com' })],
      memberRows: [exMember({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(review.counts.waitingCount).toBe(1)
    expect(review.counts.alreadyMemberCount).toBe(0)
  })
})

describe('buildLeadsReview, the applications that were declined', () => {
  it('should list an application marked declined, so the decision can be revisited', () => {
    const review = reviewOf({
      leads: [lead({ name: 'Turned Away', email: 'declined@example.com', status: 'declined' })],
    })

    expect(review.declinedApplications.map((declined) => declined.lead.email)).toEqual([
      'declined@example.com',
    ])
  })

  it('should leave a pending application out of the declined list', () => {
    const review = reviewOf({ leads: [lead({ email: 'waiting@example.com' })] })

    expect(review.declinedApplications).toEqual([])
  })

  it('should leave an approved application out of the declined list', () => {
    const review = reviewOf({
      leads: [lead({ email: 'approved@example.com', status: 'approved' })],
    })

    expect(review.declinedApplications).toEqual([])
  })

  it('should list the declined applications in sheet order, like the queue above them', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 9, name: 'Newer', email: 'newer@example.com', status: 'declined' }),
        lead({ rowNumber: 2, name: 'Older', email: 'older@example.com', status: 'declined' }),
      ],
    })

    expect(review.declinedApplications.map((declined) => declined.lead.name)).toEqual([
      'Older',
      'Newer',
    ])
  })

  it('should count the declined applications, since the view has to say how many', () => {
    const review = reviewOf({
      leads: [
        lead({ rowNumber: 2, email: 'one@example.com', status: 'declined' }),
        lead({ rowNumber: 3, email: 'two@example.com', status: 'declined' }),
        lead({ rowNumber: 4, email: 'waiting@example.com' }),
      ],
    })

    expect(review.counts.declinedCount).toBe(2)
  })

  it('should tell the reviewer which member row a declined ex-member already has', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com', status: 'declined' })],
      memberRows: [
        exMember({ name: 'Dana Maman', mail: 'dana@example.com', removalReason: 'Moved abroad' }),
      ],
    })

    expect(review.declinedApplications[0]?.priorMember?.rowNumber).toBe(2)
  })

  it('should keep a declined applicant who is already an active member visible rather than dropping them', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com', status: 'declined' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(review.declinedApplications.map((declined) => declined.lead.email)).toEqual([
      'dana@example.com',
    ])
  })

  it('should promise no reactivation for a declined applicant whose member row is active', () => {
    const review = reviewOf({
      leads: [lead({ email: 'dana@example.com', status: 'declined' })],
      memberRows: [activeMember({ name: 'Dana Maman', mail: 'dana@example.com' })],
    })

    expect(review.declinedApplications[0]?.priorMember).toBeUndefined()
  })

  it('should report nothing declined for an empty Leads tab', () => {
    const review = reviewOf({ leads: [] })

    expect(review.declinedApplications).toEqual([])
    expect(review.counts.declinedCount).toBe(0)
  })
})
