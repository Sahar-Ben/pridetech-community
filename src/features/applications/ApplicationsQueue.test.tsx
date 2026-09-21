import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsQueue } from './ApplicationsQueue'
import type { Lead } from './lead'
import type { LeadDecisions, LeadDecisionState } from './useLeadDecisions'
import { buildLeadsReviewFixture } from '../../testing/leadsReviewFactory'
import { memberRow } from '../../testing/sheetsClientFactory'

const IDLE: LeadDecisionState = { isSaving: false, errorMessage: undefined }

const pendingLead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2, timestamp: '3/8/2025 14:25:20', name: 'Dana Maman', jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana', email: 'dana@saltedmind.co',
  phone: '050', city: 'Tel Aviv', interests: 'AI', status: 'pending', ...overrides,
})

const stubDecisions = ({
  approve = vi.fn(),
  decline = vi.fn(),
  markMaybe = vi.fn(),
  stateByRowNumber = new Map<number, LeadDecisionState>(),
}: {
  approve?: LeadDecisions['approve']
  decline?: LeadDecisions['decline']
  markMaybe?: LeadDecisions['markMaybe']
  stateByRowNumber?: ReadonlyMap<number, LeadDecisionState>
} = {}): LeadDecisions => ({
  decidedRowNumbers: new Set(),
  stateFor: (rowNumber) => stateByRowNumber.get(rowNumber) ?? IDLE,
  approve,
  decline,
  markMaybe,
  forgetDecisions: vi.fn(),
})

const renderQueue = ({
  leads = [pendingLead()],
  memberRows = [],
  rowsWithoutEmail = [],
  spreadsheetId = 'picked-sheet-id',
  decisions = stubDecisions(),
  onReload = vi.fn(),
}: {
  leads?: readonly Lead[]
  memberRows?: readonly string[][]
  rowsWithoutEmail?: readonly { rowNumber: number; name: string | undefined }[]
  spreadsheetId?: string
  decisions?: LeadDecisions
  onReload?: () => void
} = {}) =>
  render(
    <ApplicationsQueue
      review={buildLeadsReviewFixture({ leads, memberRows, rowsWithoutEmail })}
      spreadsheetId={spreadsheetId}
      decisions={decisions}
      onReload={onReload}
    />,
  )

const showRepeatedAddresses = async () => {
  await userEvent.click(
    screen.getByRole('button', { name: /appear.? on more than one application/i }),
  )
}

const showApplicationsWithoutEmail = async () => {
  await userEvent.click(screen.getByRole('button', { name: /no email address/i }))
}

describe('ApplicationsQueue', () => {
  it('should show each pending applicant with their title and company', () => {
    renderQueue()
    expect(screen.getByText('Dana Maman')).toBeInTheDocument()
    expect(screen.getByText(/Founder/)).toBeInTheDocument()
    expect(screen.getByText(/Salted Mind/)).toBeInTheDocument()
  })

  it('should link to the applicant LinkedIn profile, since gender is decided from it', () => {
    renderQueue()
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href', 'https://linkedin.com/in/dana',
    )
  })

  it('should hide applications that have already been decided', () => {
    renderQueue({ leads: [pendingLead(), pendingLead({ name: 'Old', status: 'approved' })] })
    expect(screen.queryByText('Old')).not.toBeInTheDocument()
  })

  it('should hide an application whose email is already on the Members tab', () => {
    renderQueue({
      leads: [pendingLead({ name: 'Already In' })],
      memberRows: [memberRow({ name: 'Already In', mail: 'dana@saltedmind.co' })],
    })
    expect(screen.queryByRole('heading', { level: 3, name: 'Already In' })).not.toBeInTheDocument()
  })

  it('should show oldest applications first, since they have waited longest', () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 9, name: 'Newer', email: 'newer@example.com' }),
        pendingLead({ rowNumber: 2, name: 'Older', email: 'older@example.com' }),
      ],
    })
    const names = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)
    expect(names).toEqual(['Older', 'Newer'])
  })

  it('should approve with the gender chosen by the reviewer', async () => {
    const onApprove = vi.fn()
    renderQueue({ decisions: stubDecisions({ approve: onApprove }) })

    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'F')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({ lead: expect.objectContaining({ name: 'Dana Maman' }), gender: 'F' })
  })

  it('should default gender to unknown so nobody is approved with a guessed value', async () => {
    const onApprove = vi.fn()
    renderQueue({ decisions: stubDecisions({ approve: onApprove }) })

    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ gender: 'unknown' }))
  })

  it('should tell the reviewer when the queue is empty', () => {
    renderQueue({ leads: [] })
    expect(screen.getByText(/no applications waiting/i)).toBeInTheDocument()
  })

  it('should decline with the applicant, so the reviewer can reject without choosing a gender', async () => {
    const onDecline = vi.fn()
    renderQueue({ decisions: stubDecisions({ decline: onDecline }) })

    await userEvent.click(screen.getByRole('button', { name: /decline/i }))

    expect(onDecline).toHaveBeenCalledWith({ lead: expect.objectContaining({ name: 'Dana Maman' }) })
  })

  it('should identify a nameless applicant by their email instead of an empty heading', () => {
    renderQueue({ leads: [pendingLead({ name: undefined })] })
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('dana@saltedmind.co')
  })

  it('should not repeat the email in the contact line when it already names the applicant', () => {
    renderQueue({ leads: [pendingLead({ name: undefined })] })
    expect(screen.getAllByText(/dana@saltedmind\.co/)).toHaveLength(1)
  })

  it('should omit the profile link when the applicant left LinkedIn blank', () => {
    renderQueue({ leads: [pendingLead({ linkedIn: undefined })] })
    expect(screen.queryByRole('link', { name: /linkedin/i })).not.toBeInTheDocument()
  })

  it('should tell the reviewer the profile is missing, since they cannot decide without one', () => {
    renderQueue({ leads: [pendingLead({ linkedIn: undefined })] })
    expect(screen.getByText(/no linkedin/i)).toBeInTheDocument()
  })

  it('should show the job title alone when the applicant left the company blank', () => {
    renderQueue({ leads: [pendingLead({ company: undefined })] })
    expect(screen.getByText('Founder')).toBeInTheDocument()
  })

  it('should show the company alone when the applicant left the job title blank', () => {
    renderQueue({ leads: [pendingLead({ jobTitle: undefined })] })
    expect(screen.getByText('Salted Mind')).toBeInTheDocument()
  })

  it('should still offer a decision when every optional field is blank', async () => {
    const onApprove = vi.fn()
    renderQueue({
      decisions: stubDecisions({ approve: onApprove }),
      leads: [
        pendingLead({
          name: undefined, jobTitle: undefined, company: undefined,
          linkedIn: undefined, phone: undefined, city: undefined, interests: undefined,
        }),
      ],
    })

    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({
      lead: expect.objectContaining({ email: 'dana@saltedmind.co' }), gender: 'unknown',
    })
  })

  it('should count what it set aside beside what is waiting', () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 2, name: 'Waiting', email: 'waiting@example.com' }),
        pendingLead({ rowNumber: 3, name: 'Already In', email: 'already@example.com' }),
      ],
      memberRows: [memberRow({ name: 'Already In', mail: 'already@example.com' })],
    })

    expect(
      screen.getByText('1 waiting \u{00b7} 1 application from an existing member'),
    ).toBeInTheDocument()
  })

  it('should leave the set-aside applicants to the Members tab instead of listing them', () => {
    renderQueue({
      leads: [pendingLead({ name: 'Already In' })],
      memberRows: [memberRow({ name: 'Dana Maman', mail: 'dana@saltedmind.co' })],
    })

    expect(screen.queryByText('Already In')).not.toBeInTheDocument()
    expect(screen.queryByText(/Members row 2/)).not.toBeInTheDocument()
  })

  it('should offer no Approve button for someone who is already a member', () => {
    renderQueue({
      leads: [pendingLead({ name: 'Already In' })],
      memberRows: [memberRow({ name: 'Dana Maman', mail: 'dana@saltedmind.co' })],
    })

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
  })

  it('should offer no control for browsing the people already on the Members tab', () => {
    renderQueue({
      leads: [pendingLead({ name: 'Already In' })],
      memberRows: [memberRow({ name: 'Dana Maman', mail: 'dana@saltedmind.co' })],
    })

    expect(
      screen.queryByRole('button', { name: /already on the members tab/i }),
    ).not.toBeInTheDocument()
  })

  it('should report the applications that carry no email even when nobody was set aside', () => {
    renderQueue({ rowsWithoutEmail: [{ rowNumber: 5, name: undefined }] })

    expect(screen.getByText(/1 application has no email address/i)).toBeInTheDocument()
  })

  it('should report the member rows that carry no email even when nobody was set aside', () => {
    renderQueue({ memberRows: [memberRow({ name: 'No Mail', mail: '' })] })

    expect(screen.getByText(/1 member row has no email address/i)).toBeInTheDocument()
  })

  it('should report the people who applied more than once even when nobody was set aside', () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 2, name: 'First Try' }),
        pendingLead({ rowNumber: 3, name: 'Second Try' }),
      ],
    })

    expect(screen.getByText(/1 email address appears on more than one application/i)).toBeInTheDocument()
  })

  it('should keep the repeated addresses out of the way until the reviewer asks for them', () => {
    renderQueue({
      leads: [pendingLead({ rowNumber: 2 }), pendingLead({ rowNumber: 9 })],
    })

    expect(screen.queryByText(/Leads rows 2, 9/)).not.toBeInTheDocument()
  })

  it('should list a repeated address with every row it was entered on', async () => {
    renderQueue({
      leads: [pendingLead({ rowNumber: 2 }), pendingLead({ rowNumber: 9 })],
    })

    await showRepeatedAddresses()

    expect(
      screen.getByText('dana@saltedmind.co \u{00b7} 2 applications \u{00b7} Leads rows 2, 9'),
    ).toBeInTheDocument()
  })

  it('should list a repeat that is already on the Members tab beside one that is still waiting', async () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 2, email: 'member@example.com' }),
        pendingLead({ rowNumber: 3, email: 'member@example.com' }),
        pendingLead({ rowNumber: 4 }),
        pendingLead({ rowNumber: 5 }),
      ],
      memberRows: [memberRow({ name: 'Dana Maman', mail: 'member@example.com' })],
    })

    await showRepeatedAddresses()

    expect(screen.getByText(/member@example\.com.*Leads rows 2, 3/u)).toBeInTheDocument()
    expect(screen.getByText(/dana@saltedmind\.co.*Leads rows 4, 5/u)).toBeInTheDocument()
  })

  it('should show every name found on a shared address, since two people may share an inbox', async () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 2, name: 'Dana Maman' }),
        pendingLead({ rowNumber: 9, name: 'Ariel Cohen' }),
      ],
    })

    await showRepeatedAddresses()

    expect(screen.getByText('Dana Maman \u{00b7} Ariel Cohen')).toBeInTheDocument()
    expect(screen.getByText(/2 different names use this address/i)).toBeInTheDocument()
  })

  it('should not warn about a shared inbox when one person simply applied twice', async () => {
    renderQueue({
      leads: [pendingLead({ rowNumber: 2 }), pendingLead({ rowNumber: 9 })],
    })

    await showRepeatedAddresses()

    expect(screen.queryByText(/different names use this address/i)).not.toBeInTheDocument()
  })

  it('should let the reviewer put the repeated addresses away again', async () => {
    renderQueue({
      leads: [pendingLead({ rowNumber: 2 }), pendingLead({ rowNumber: 9 })],
    })

    await showRepeatedAddresses()
    await showRepeatedAddresses()

    expect(screen.queryByText(/Leads rows 2, 9/)).not.toBeInTheDocument()
  })

  it('should offer no repeated-address list when every applicant applied once', () => {
    renderQueue()

    expect(
      screen.queryByRole('button', { name: /appear.? on more than one application/i }),
    ).not.toBeInTheDocument()
  })

  it('should link every row of a repeated address to that row in the sheet', async () => {
    renderQueue({
      leads: [
        pendingLead({ rowNumber: 2 }),
        pendingLead({ rowNumber: 9 }),
        pendingLead({ rowNumber: 14 }),
      ],
    })

    await showRepeatedAddresses()

    expect(screen.getAllByRole('link', { name: /open row \d+ in the sheet/i })).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Open row 9 in the sheet' })).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/picked-sheet-id/edit?range=Leads!A9',
    )
  })

  it('should open a sheet row in its own tab, so the queue is not navigated away', async () => {
    renderQueue({ leads: [pendingLead({ rowNumber: 2 }), pendingLead({ rowNumber: 9 })] })

    await showRepeatedAddresses()
    const link = screen.getByRole('link', { name: 'Open row 2 in the sheet' })

    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should keep the application that has no email out of the way until the reviewer asks', () => {
    renderQueue({ rowsWithoutEmail: [{ rowNumber: 412, name: 'Dana Levi' }] })

    expect(screen.queryByText(/Leads row 412/)).not.toBeInTheDocument()
  })

  it('should show the single application that has no email with a link to its row', async () => {
    renderQueue({ rowsWithoutEmail: [{ rowNumber: 412, name: 'Dana Levi' }] })

    await showApplicationsWithoutEmail()

    expect(screen.getByText('Leads row 412 \u{00b7} Dana Levi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open row 412 in the sheet' })).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/picked-sheet-id/edit?range=Leads!A412',
    )
  })

  it('should say that fixing these means editing the sheet itself', () => {
    renderQueue({ rowsWithoutEmail: [{ rowNumber: 412, name: 'Dana Levi' }] })

    expect(screen.getByText(/editing the Leads tab in Google Sheets/i)).toBeInTheDocument()
  })

  it('should keep quiet about editing the sheet when there is nothing to fix', () => {
    renderQueue()

    expect(screen.queryByText(/editing the Leads tab in Google Sheets/i)).not.toBeInTheDocument()
  })

  it('should never claim the app writes nothing, now that a decision is written', () => {
    renderQueue({ rowsWithoutEmail: [{ rowNumber: 412, name: 'Dana Levi' }] })

    expect(screen.queryByText(/never writes/i)).not.toBeInTheDocument()
  })

  it('should offer no read-only warning above the queue', () => {
    renderQueue()

    expect(screen.queryByText(/read-only/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not connected to the spreadsheet/i)).not.toBeInTheDocument()
  })

  it('should let the reviewer read the sheet again without a failure first', async () => {
    const onReload = vi.fn()
    renderQueue({ onReload })

    await userEvent.click(screen.getByRole('button', { name: /reload applications/i }))

    expect(onReload).toHaveBeenCalledTimes(1)
  })
})

describe('ApplicationsQueue, for an applicant who was a member before', () => {
  const returningQueue = ({
    removalReason = '',
    decisions = stubDecisions(),
  }: { removalReason?: string; decisions?: LeadDecisions } = {}) =>
    renderQueue({
      decisions,
      leads: [pendingLead({ name: 'Dana Maman' })],
      memberRows: [
        memberRow({
          name: 'Dana Maman',
          mail: 'dana@saltedmind.co',
          status: 'Ex-member',
          removalReason,
        }),
      ],
    })

  it('should keep them in the queue rather than set them aside', () => {
    returningQueue()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
  })

  it('should say they already have a member row, and which one', () => {
    returningQueue()

    expect(screen.getByText(/already has a member record on Members row 2/i)).toBeInTheDocument()
  })

  it('should say approving brings that record back rather than adding a second row', () => {
    returningQueue()

    expect(screen.getByText(/rather than adding a second row/i)).toBeInTheDocument()
  })

  it('should put the reason they were removed in front of the reviewer before they decide', () => {
    returningQueue({ removalReason: 'Code of conduct' })

    expect(screen.getByText(/Reason they were removed: Code of conduct/i)).toBeInTheDocument()
  })

  it('should say nothing about a prior record for an applicant who never had one', () => {
    renderQueue()

    expect(screen.queryByText(/already has a member record/i)).not.toBeInTheDocument()
  })

  it('should not call a member whose status was never filled in a returning ex-member', () => {
    renderQueue({
      leads: [pendingLead({ name: 'Dana Maman' })],
      memberRows: [memberRow({ name: 'Dana Maman', mail: 'dana@saltedmind.co', status: '' })],
    })

    expect(screen.queryByText(/already has a member record/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Dana Maman' })).not.toBeInTheDocument()
  })
})

describe('ApplicationsQueue, while a decision is being written', () => {
  const savingQueue = () =>
    renderQueue({
      decisions: stubDecisions({
        stateByRowNumber: new Map([[2, { isSaving: true, errorMessage: undefined }]]),
      }),
    })

  it('should not let the reviewer submit the same application twice', () => {
    savingQueue()

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled()
  })

  it('should keep the application on screen while its decision is in flight', () => {
    savingQueue()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
  })
})

describe('ApplicationsQueue, when a decision failed', () => {
  const failedQueue = () =>
    renderQueue({
      decisions: stubDecisions({
        stateByRowNumber: new Map([
          [2, { isSaving: false, errorMessage: 'Approving Dana Maman failed. quota exceeded' }],
        ]),
      }),
    })

  it('should keep the card, because a failed approval is still waiting', () => {
    failedQueue()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
  })

  it('should show what went wrong on the card itself', () => {
    failedQueue()

    expect(screen.getByRole('alert')).toHaveTextContent(/quota exceeded/)
  })

  it('should let the reviewer try the decision again', () => {
    failedQueue()

    expect(screen.getByRole('button', { name: /approve/i })).toBeEnabled()
  })
})

describe('ApplicationsQueue, filtering by status', () => {
  const declinedLead = (overrides: Partial<Lead> = {}): Lead =>
    pendingLead({
      rowNumber: 3,
      name: 'Turned Away',
      email: 'turned@example.com',
      status: 'declined',
      ...overrides,
    })

  const showDeclined = async () => {
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'Declined')
  }

  const showPending = async () => {
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'Pending')
  }

  const renderBothStates = (decisions = stubDecisions()) =>
    renderQueue({ decisions, leads: [pendingLead(), declinedLead()] })

  it('should show the applications waiting for review before the reviewer filters anything', () => {
    renderBothStates()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Turned Away' })).not.toBeInTheDocument()
  })

  it('should show only the declined applications once the reviewer asks for them', async () => {
    renderBothStates()

    await showDeclined()

    expect(screen.getByRole('heading', { level: 3, name: 'Turned Away' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Dana Maman' })).not.toBeInTheDocument()
  })

  it('should bring the queue back when the reviewer switches to Pending again', async () => {
    renderBothStates()

    await showDeclined()
    await showPending()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Turned Away' })).not.toBeInTheDocument()
  })

  it('should offer no way to decline an application that was already declined', async () => {
    renderBothStates()

    await showDeclined()

    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument()
  })

  it('should approve a declined applicant through the same approve path', async () => {
    const onApprove = vi.fn()
    renderBothStates(stubDecisions({ approve: onApprove }))

    await showDeclined()
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'F')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({
      lead: expect.objectContaining({ name: 'Turned Away' }),
      gender: 'F',
    })
  })

  it('should count what is waiting under Pending', () => {
    renderBothStates()

    expect(screen.getByText('1 waiting')).toBeInTheDocument()
  })

  it('should count the declined applications under Declined', async () => {
    renderBothStates()

    await showDeclined()

    expect(screen.getByText('1 declined')).toBeInTheDocument()
  })

  it('should say that nothing is waiting when every application has been decided', () => {
    renderQueue({ leads: [declinedLead()] })

    expect(screen.getByText('No applications waiting for review.')).toBeInTheDocument()
  })

  it('should say that nothing has been declined when the declined list is empty', async () => {
    renderQueue({ leads: [pendingLead()] })

    await showDeclined()

    expect(screen.getByText('No applications have been declined.')).toBeInTheDocument()
  })

  it('should still report what the sheet itself needs fixing under either view', async () => {
    renderQueue({
      leads: [declinedLead()],
      rowsWithoutEmail: [{ rowNumber: 412, name: 'Dana Levi' }],
    })

    await showDeclined()

    expect(screen.getByText(/1 application has no email address/i)).toBeInTheDocument()
  })
})

describe('ApplicationsQueue, applications kept for later', () => {
  const pending = () => pendingLead()

  const maybeLead = () =>
    pendingLead({
      rowNumber: 4,
      name: 'Come Back Later',
      email: 'later@example.com',
      status: 'maybe',
    })

  const showMaybe = async () => {
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'Maybe')
  }

  const renderBothStates = (decisions = stubDecisions()) =>
    renderQueue({ decisions, leads: [pending(), maybeLead()] })

  it('should offer keeping a pending application for later', async () => {
    const onMarkMaybe = vi.fn()
    renderQueue({ decisions: stubDecisions({ markMaybe: onMarkMaybe }), leads: [pending()] })

    await userEvent.click(screen.getByRole('button', { name: /maybe/i }))

    expect(onMarkMaybe).toHaveBeenCalledWith({
      lead: expect.objectContaining({ name: 'Dana Maman' }),
    })
  })

  it('should keep an application marked for later out of the pending queue', () => {
    renderBothStates()

    expect(screen.getByRole('heading', { level: 3, name: 'Dana Maman' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Come Back Later' }),
    ).not.toBeInTheDocument()
  })

  it('should list only the applications kept for later once the reviewer asks for them', async () => {
    renderBothStates()

    await showMaybe()

    expect(screen.getByRole('heading', { level: 3, name: 'Come Back Later' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Dana Maman' })).not.toBeInTheDocument()
  })

  it('should offer approving and declining, and no second maybe, under Maybe', async () => {
    renderBothStates()

    await showMaybe()

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^maybe$/i })).not.toBeInTheDocument()
  })

  it('should approve somebody kept for later through the same approve path', async () => {
    const onApprove = vi.fn()
    renderBothStates(stubDecisions({ approve: onApprove }))

    await showMaybe()
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'F')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({
      lead: expect.objectContaining({ name: 'Come Back Later' }),
      gender: 'F',
    })
  })

  it('should count what is being kept for later, and not what is waiting', async () => {
    renderBothStates()

    await showMaybe()

    expect(screen.getByText('1 kept for later')).toBeInTheDocument()
    expect(screen.queryByText('1 waiting')).not.toBeInTheDocument()
  })

  it('should say in its own words when nothing is being kept for later', async () => {
    renderQueue({ leads: [pending()] })

    await showMaybe()

    expect(screen.getByText('No applications are being kept for later.')).toBeInTheDocument()
  })

  it('should offer no route back to pending from any view', async () => {
    renderBothStates()

    await showMaybe()

    expect(screen.queryByRole('button', { name: /pending/i })).not.toBeInTheDocument()
  })
})
