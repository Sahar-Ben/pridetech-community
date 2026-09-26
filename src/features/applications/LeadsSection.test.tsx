import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LeadsSection } from './LeadsSection'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  LEADS_HEADER_ROW_WITH_REASON,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

const NOA_STATUS_CELL = 'Leads!K2'

const sheetWithTwoPendingLeads = ({
  members = [MEMBERS_HEADER_ROW],
  leadsHeader = LEADS_HEADER_ROW,
}: {
  members?: readonly (readonly string[])[]
  leadsHeader?: readonly string[]
} = {}): FakeSheet =>
  createFakeSheet({
    tabs: {
      Leads: [
        leadsHeader,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
      ],
      Members: members,
    },
  })

const renderSection = ({
  sheetsClient,
  onSessionExpired = vi.fn(),
}: {
  sheetsClient: SheetsClient
  onSessionExpired?: () => void
}) => render(<LeadsSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />)

const cardFor = (name: string): HTMLElement => {
  const heading = screen.getByRole('heading', { level: 3, name })
  const card = heading.closest('li')
  if (card === null) {
    throw new Error(`the queue rendered no card for ${name}`)
  }
  return card
}

const decide = async ({ applicant, action }: { applicant: string; action: RegExp }) => {
  await userEvent.click(within(cardFor(applicant)).getByRole('button', { name: action }))
}

/* Declining and keeping for later both go through the reason dialog now, so an
   end-to-end test has to answer it the way a reviewer would. */
const skipTheReason = async () => {
  await userEvent.click(screen.getByRole('button', { name: /skip/i }))
}

const applyTheReason = async (reason: string) => {
  await userEvent.type(screen.getByLabelText(/reason/i), reason)
  await userEvent.click(screen.getByRole('button', { name: /apply/i }))
}

const memberCell = ({ row, heading }: { row: readonly string[]; heading: string }): string =>
  row[MEMBERS_HEADER_ROW.indexOf(heading)] ?? ''

describe('LeadsSection, reading the sheet', () => {
  it('should leave out an application whose email is already on the Members tab', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
      ],
      memberRows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Ariel Cohen', mail: 'Ariel@example.com' })],
    })

    renderSection({ sheetsClient })

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Ariel Cohen' })).not.toBeInTheDocument()
    expect(
      screen.getByText('1 waiting \u{00b7} 1 application from an existing member'),
    ).toBeInTheDocument()
  })

  it('should keep an application whose match on the Members tab is an ex-member', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' })],
      memberRows: [
        MEMBERS_HEADER_ROW,
        memberRow({
          name: 'Ariel Cohen',
          mail: 'ariel@example.com',
          status: 'Ex-member',
          removalReason: 'Moved abroad',
        }),
      ],
    })

    renderSection({ sheetsClient })

    expect(await screen.findByRole('heading', { level: 3, name: 'Ariel Cohen' })).toBeInTheDocument()
    expect(screen.getByText(/Reason they were removed: Moved abroad/i)).toBeInTheDocument()
  })

  it('should show no queue at all when the Members tab cannot be read', async () => {
    const readRange = vi.fn().mockImplementation(({ range }: { range: string }) =>
      range.startsWith('Members')
        ? Promise.reject(
            new SheetsRequestError({ range, status: 403, detail: 'Caller lacks permission' }),
          )
        : Promise.resolve([
            LEADS_HEADER_ROW,
            leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
          ]),
    )

    renderSection({ sheetsClient: createFakeSheetsClient({ readRange }) })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Members tab could not be read/i)
    expect(screen.queryByText('Noa Feldman')).not.toBeInTheDocument()
  })

  it('should say the sheet is being read while the rows are on their way', () => {
    renderSection({ sheetsClient: sheetWithTwoPendingLeads().client })

    expect(screen.getByRole('status')).toHaveTextContent(/reading/i)
  })

  it('should list the applications read from the Leads tab', async () => {
    renderSection({ sheetsClient: sheetWithTwoPendingLeads().client })

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
    expect(screen.getByText('Ariel Cohen')).toBeInTheDocument()
  })

  it('should no longer warn that decisions are not written to the sheet', async () => {
    renderSection({ sheetsClient: sheetWithTwoPendingLeads().client })
    await screen.findByText('Noa Feldman')

    expect(screen.queryByText(/not connected/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/read-only/i)).not.toBeInTheDocument()
  })

  it('should show what Google said when the sheet cannot be read', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({
          range: 'Leads!A1:Z',
          status: 403,
          detail: 'The caller does not have permission',
        }),
      )

    renderSection({ sheetsClient: createFakeSheetsClient({ readRange }) })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /403.*The caller does not have permission/,
    )
    expect(screen.queryByRole('heading', { name: 'Applications' })).not.toBeInTheDocument()
  })

  it('should read the sheet again when the reviewer retries a failed read', async () => {
    let hasLeadsReadFailed = false
    const readRange = vi.fn().mockImplementation(({ range }: { range: string }) => {
      if (range.startsWith('Leads') && !hasLeadsReadFailed) {
        hasLeadsReadFailed = true
        return Promise.reject(
          new SheetsRequestError({ range, status: 500, detail: 'Backend error' }),
        )
      }
      return Promise.resolve(
        range.startsWith('Members')
          ? [MEMBERS_HEADER_ROW]
          : [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
      )
    })

    renderSection({ sheetsClient: createFakeSheetsClient({ readRange }) })
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
  })

  it('should tell the app to sign in again when the token has expired', async () => {
    const onSessionExpired = vi.fn()
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 401, detail: 'Invalid Credentials' }),
      )

    renderSection({ sheetsClient: createFakeSheetsClient({ readRange }), onSessionExpired })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
  })

  it('should link a repeated row to the spreadsheet the reviewer picked, not a fixed one', async () => {
    const sheetsClient = createFakeSheetsClient({
      spreadsheetId: 'stored-sheet-id',
      rows: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Noa Feldman', email: 'Noa@example.com' }),
      ],
    })

    renderSection({ sheetsClient })

    await userEvent.click(
      await screen.findByRole('button', { name: /appear.? on more than one application/i }),
    )

    expect(screen.getByRole('link', { name: 'Open row 2 in the sheet' })).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/stored-sheet-id/edit?range=Leads!A2',
    )
  })
})

describe('LeadsSection, approving an application', () => {
  it('should add the applicant to the Members tab and mark the application approved', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    await waitFor(() => {
      expect(sheet.writes.map((write) => write.kind)).toEqual(['append', 'update'])
    })
    const appended = sheet.rowsOf('Members')[1] ?? []
    expect(memberCell({ row: appended, heading: 'Name' })).toBe('Noa Feldman')
    expect(memberCell({ row: appended, heading: 'Mail' })).toBe('noa@example.com')
    expect(memberCell({ row: appended, heading: 'Status' })).toBe('Active')
    expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('Approved')
  })

  it('should take the approved application out of the queue and count down', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')
    expect(screen.getByText('2 waiting')).toBeInTheDocument()

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Noa Feldman' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('1 waiting')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ariel Cohen' })).toBeInTheDocument()
  })

  it('should record the gender the reviewer chose', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await userEvent.selectOptions(
      within(cardFor('Noa Feldman')).getByLabelText(/gender/i),
      'F',
    )
    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    await waitFor(() => {
      expect(sheet.rowsOf('Members')).toHaveLength(2)
    })
    expect(memberCell({ row: sheet.rowsOf('Members')[1] ?? [], heading: 'Gender' })).toBe('F')
  })

  it('should reactivate a returning ex-member instead of adding a second row', async () => {
    const sheet = sheetWithTwoPendingLeads({
      members: [
        MEMBERS_HEADER_ROW,
        memberRow({
          name: 'Noa Feldman',
          mail: 'noa@example.com',
          status: 'Ex-member',
          removalReason: 'Moved abroad',
        }),
      ],
    })
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('Approved')
    })
    expect(sheet.rowsOf('Members')).toHaveLength(2)
    const reactivated = sheet.rowsOf('Members')[1] ?? []
    expect(memberCell({ row: reactivated, heading: 'Status' })).toBe('Active')
    expect(memberCell({ row: reactivated, heading: 'Removal reason' })).toBe('')
  })
})

describe('LeadsSection, declining an application', () => {
  it('should mark the application declined and add nobody to the Members tab', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await skipTheReason()

    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('Declined')
    })
    expect(sheet.writes).toEqual([
      {
        kind: 'update',
        range: NOA_STATUS_CELL,
        values: ['Declined'],
        valueInputOption: 'RAW',
      },
    ])
    expect(sheet.rowsOf('Members')).toEqual([MEMBERS_HEADER_ROW])
  })

  it('should take the declined application out of the queue', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await skipTheReason()

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Noa Feldman' })).not.toBeInTheDocument()
    })
  })

  it('should write the reason the reviewer applied beside the status', async () => {
    const sheet = sheetWithTwoPendingLeads({ leadsHeader: LEADS_HEADER_ROW_WITH_REASON })
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await applyTheReason('Not in Tech')

    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[1]?.[11]).toBe('Not in Tech')
    })
    expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('Declined')
  })

  it('should leave the application in the queue, undecided, when the reviewer cancels', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('heading', { level: 3, name: 'Noa Feldman' })).toBeInTheDocument()
    expect(sheet.writes).toEqual([])
  })

  it('should keep the card with the reason it could not be written, when the tab has no Reason column', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await applyTheReason('Not in Tech')

    expect(await within(cardFor('Noa Feldman')).findByRole('alert')).toHaveTextContent(
      /Reason column/i,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(sheet.writes).toEqual([])
  })

  it('should keep the dialog up, saying so, until the sheet has taken the decision', async () => {
    const sheet = sheetWithTwoPendingLeads({ leadsHeader: LEADS_HEADER_ROW_WITH_REASON })
    let releaseTheWrite = () => {}
    const gatedClient: SheetsClient = {
      ...sheet.client,
      updateCells: async (options) => {
        await new Promise<void>((resolve) => {
          releaseTheWrite = resolve
        })
        await sheet.client.updateCells(options)
      },
    }
    renderSection({ sheetsClient: gatedClient })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /decline/i })
    await applyTheReason('Not in Tech')

    expect(screen.getByRole('status')).toHaveTextContent(/saving/i)

    await act(async () => {
      releaseTheWrite()
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})

describe('LeadsSection, when a decision cannot be written', () => {
  const sheetThatRefusesWrites = ({ status, detail }: { status: number; detail: string }) => {
    const sheet = sheetWithTwoPendingLeads()
    const refusingClient: SheetsClient = {
      ...sheet.client,
      appendRow: () =>
        Promise.reject(new SheetsRequestError({ range: 'Members!A:Z', status, detail })),
    }
    return { sheet, client: refusingClient }
  }

  it('should keep the card in the queue with the failure written on it', async () => {
    const { sheet, client } = sheetThatRefusesWrites({ status: 500, detail: 'Backend error' })
    renderSection({ sheetsClient: client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    expect(await within(cardFor('Noa Feldman')).findByRole('alert')).toHaveTextContent(
      /Approving Noa Feldman failed.*Backend error/,
    )
    expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('')
  })

  it('should say a refusal is about the file this app was granted, not a failed request', async () => {
    const { client } = sheetThatRefusesWrites({
      status: 403,
      detail: 'The caller does not have permission',
    })
    renderSection({ sheetsClient: client })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    expect(await within(cardFor('Noa Feldman')).findByRole('alert')).toHaveTextContent(
      /no permission to change this spreadsheet/i,
    )
  })

  it('should hand an expired session to the app rather than write it on the card', async () => {
    const onSessionExpired = vi.fn()
    const { client } = sheetThatRefusesWrites({ status: 401, detail: 'Invalid Credentials' })
    renderSection({ sheetsClient: client, onSessionExpired })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
    expect(within(cardFor('Noa Feldman')).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should say the sheet changed underneath when the application row has moved', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          LEADS_HEADER_ROW,
          leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
          leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
        ],
        Members: [MEMBERS_HEADER_ROW],
      },
    })
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    sheet.replaceRows({
      tabName: 'Leads',
      rows: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Somebody Inserted', email: 'inserted@example.com' }),
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
      ],
    })
    await decide({ applicant: 'Noa Feldman', action: /approve/i })

    expect(await within(cardFor('Noa Feldman')).findByRole('alert')).toHaveTextContent(/changed/i)
    expect(sheet.writes).toEqual([])
  })

  it('should offer the reviewer a way to read the sheet again after it changed', async () => {
    const sheet = sheetWithTwoPendingLeads()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')

    expect(screen.getByRole('button', { name: /reload applications/i })).toBeEnabled()
  })
})

describe('LeadsSection, while a decision is in flight', () => {
  it('should refuse a second click on the same application', async () => {
    const sheet = sheetWithTwoPendingLeads()
    let releaseAppend: () => void = () => {}
    const heldAppend = new Promise<void>((resolve) => {
      releaseAppend = resolve
    })
    const slowClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        await heldAppend
        await sheet.client.appendRow(options)
      },
    }
    renderSection({ sheetsClient: slowClient })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })
    const savingButton = within(cardFor('Noa Feldman')).getByRole('button', { name: /saving/i })
    expect(savingButton).toBeDisabled()
    expect(within(cardFor('Noa Feldman')).getByRole('button', { name: /decline/i })).toBeDisabled()

    releaseAppend()

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Noa Feldman' })).not.toBeInTheDocument()
    })
    expect(sheet.writes.filter((write) => write.kind === 'append')).toHaveLength(1)
  })
})

describe('LeadsSection, when the reviewer reloads while a decision is in flight', () => {
  const heldApproval = () => {
    const sheet = sheetWithTwoPendingLeads()
    let releaseAppend: () => void = () => {}
    const heldAppend = new Promise<void>((resolve) => {
      releaseAppend = resolve
    })
    let appendCallCount = 0
    const heldClient: SheetsClient = {
      ...sheet.client,
      appendRow: async (options) => {
        appendCallCount += 1
        await heldAppend
        await sheet.client.appendRow(options)
      },
    }
    return { sheet, heldClient, release: () => releaseAppend(), appendCount: () => appendCallCount }
  }

  const reload = async () => {
    await userEvent.click(screen.getByRole('button', { name: /reload applications/i }))
  }

  it('should keep the application locked, so a reload cannot start a second write for it', async () => {
    const { heldClient, appendCount } = heldApproval()
    renderSection({ sheetsClient: heldClient })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })
    await waitFor(() => {
      expect(appendCount()).toBe(1)
    })
    await reload()

    expect(within(cardFor('Noa Feldman')).getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(appendCount()).toBe(1)
  })

  it('should leave every application of the new read in the queue when the old write lands', async () => {
    const { sheet, heldClient, release } = heldApproval()
    renderSection({ sheetsClient: heldClient })
    await screen.findByText('Noa Feldman')

    await decide({ applicant: 'Noa Feldman', action: /approve/i })
    await reload()
    release()
    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[1]?.[10]).toBe('Approved')
    })

    expect(screen.getByRole('heading', { level: 3, name: 'Noa Feldman' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ariel Cohen' })).toBeInTheDocument()
  })
})

describe('LeadsSection, the declined applications', () => {
  const sheetWithADeclinedLead = (): FakeSheet =>
    createFakeSheet({
      tabs: {
        Leads: [
          LEADS_HEADER_ROW,
          leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
          leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com', status: 'Declined' }),
        ],
        Members: [MEMBERS_HEADER_ROW],
      },
    })

  const showDeclined = async () => {
    await userEvent.click(await screen.findByRole('tab', { name: /^declined/i }))
  }

  it('should keep a declined application out of the queue but list it under Declined', async () => {
    renderSection({ sheetsClient: sheetWithADeclinedLead().client })
    await screen.findByText('Noa Feldman')
    expect(screen.queryByRole('heading', { level: 3, name: 'Ariel Cohen' })).not.toBeInTheDocument()

    await showDeclined()

    expect(screen.getByRole('heading', { level: 3, name: 'Ariel Cohen' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Noa Feldman' })).not.toBeInTheDocument()
  })

  it('should count a status nobody recognises as pending, so the applicant stays visible', async () => {
    const sheet = createFakeSheet({
      tabs: {
        Leads: [
          LEADS_HEADER_ROW,
          leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com', status: 'Decline' }),
        ],
        Members: [MEMBERS_HEADER_ROW],
      },
    })
    renderSection({ sheetsClient: sheet.client })

    expect(await screen.findByRole('heading', { level: 3, name: 'Ariel Cohen' })).toBeInTheDocument()

    await showDeclined()

    expect(screen.queryByRole('heading', { level: 3, name: 'Ariel Cohen' })).not.toBeInTheDocument()
  })

  it('should add a declined applicant to the Members tab and rewrite their status when approved', async () => {
    const sheet = sheetWithADeclinedLead()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')
    await showDeclined()

    await decide({ applicant: 'Ariel Cohen', action: /approve/i })

    await waitFor(() => {
      expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Approved')
    })
    expect(sheet.writes.map((write) => write.kind)).toEqual(['append', 'update'])
    const appended = sheet.rowsOf('Members')[1] ?? []
    expect(memberCell({ row: appended, heading: 'Name' })).toBe('Ariel Cohen')
    expect(memberCell({ row: appended, heading: 'Status' })).toBe('Active')
  })

  it('should take the approved application out of the declined list and count down', async () => {
    const sheet = sheetWithADeclinedLead()
    renderSection({ sheetsClient: sheet.client })
    await screen.findByText('Noa Feldman')
    await showDeclined()
    expect(screen.getByText('1 declined')).toBeInTheDocument()

    await decide({ applicant: 'Ariel Cohen', action: /approve/i })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 3, name: 'Ariel Cohen' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('No applications have been declined.')).toBeInTheDocument()
  })

  it('should keep the declined applicant listed with the failure on their card when the write fails', async () => {
    const sheet = sheetWithADeclinedLead()
    const refusingClient: SheetsClient = {
      ...sheet.client,
      appendRow: () =>
        Promise.reject(
          new SheetsRequestError({ range: 'Members!A:Z', status: 500, detail: 'Backend error' }),
        ),
    }
    renderSection({ sheetsClient: refusingClient })
    await screen.findByText('Noa Feldman')
    await showDeclined()

    await decide({ applicant: 'Ariel Cohen', action: /approve/i })

    expect(await within(cardFor('Ariel Cohen')).findByRole('alert')).toHaveTextContent(
      /Approving Ariel Cohen failed.*Backend error/,
    )
    expect(sheet.rowsOf('Leads')[2]?.[10]).toBe('Declined')
  })
})
