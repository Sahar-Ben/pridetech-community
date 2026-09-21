import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OverviewSection } from './OverviewSection'
import { createFakeSheet } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
} from '../../testing/sheetsClientFactory'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

type SheetMember = {
  name: string
  mail: string
  gender?: string
  company?: string
  title?: string
  status?: string
}

const sheetMember = ({
  name,
  mail,
  gender = '',
  company = 'Salted Mind',
  title = 'Backend Developer',
  status = 'Active',
}: SheetMember): string[] => [
  name,
  company,
  title,
  gender,
  mail,
  'Yes',
  '1st',
  '',
  'Tel Aviv',
  '',
  '',
  '',
  '',
  status,
  '',
  '',
  '',
  '',
]

const sheetWith = ({
  members,
  leads = [],
}: {
  members: readonly string[][]
  leads?: readonly string[][]
}) =>
  createFakeSheet({
    tabs: {
      Members: [MEMBERS_HEADER_ROW, ...members],
      Leads: [LEADS_HEADER_ROW, ...leads],
    },
  })

const renderSection = ({
  sheetsClient,
  onSessionExpired = vi.fn(),
}: {
  sheetsClient: SheetsClient
  onSessionExpired?: () => void
}) => render(<OverviewSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />)

const cardFor = async (title: string): Promise<HTMLElement> => {
  const heading = await screen.findByRole('heading', { name: title })
  const card = heading.closest('section')
  if (card === null) {
    throw new Error(`the ${title} chart is not inside a card`)
  }
  return card
}

const DANA = sheetMember({ name: 'Dana Sorkin', mail: 'dana@example.com', gender: 'F' })
const TOMER = sheetMember({ name: 'Tomer Reznik', mail: 'tomer@example.com', gender: 'M' })
const UNRECORDED = sheetMember({ name: 'Noa Feldman', mail: 'noa@example.com' })

describe('OverviewSection', () => {
  it('should say it is reading the sheet before it can draw anything', () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA] }).client })

    expect(screen.getByRole('status')).toHaveTextContent(/Members and Leads tabs/)
  })

  it('should count the community it read', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA, TOMER, UNRECORDED] }).client })

    const activeMembersLabel = await screen.findByText('Active members')
    expect(activeMembersLabel.nextElementSibling).toHaveTextContent('3')
  })

  it('should show the gender split including the members whose gender was never recorded', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA, TOMER, UNRECORDED] }).client })

    const card = within(await cardFor('Gender'))
    expect(card.getByText(/1 of 3 members \(33%\) have no gender recorded/)).toBeInTheDocument()
  })

  it('should say which numbers were counted and which were guessed', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA] }).client })

    expect(within(await cardFor('Gender')).getByText('Counted')).toBeInTheDocument()
    expect(within(await cardFor('Time in the community')).getByText('Derived')).toBeInTheDocument()
    expect(within(await cardFor('Discipline')).getByText('Inferred')).toBeInTheDocument()
    expect(within(await cardFor('Seniority')).getByText('Inferred')).toBeInTheDocument()
  })

  it('should reach the numbers behind a chart without hovering anything', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA, TOMER, UNRECORDED] }).client })
    const card = within(await cardFor('Gender'))

    await userEvent.click(card.getByText('Show the numbers'))

    const table = within(card.getByRole('table', { name: /active members by gender/i }))
    expect(table.getByRole('rowheader', { name: 'Not recorded' })).toBeInTheDocument()
  })

  it('should band members with no application as undatable rather than as new', async () => {
    renderSection({
      sheetsClient: sheetWith({
        members: [DANA, TOMER],
        leads: [leadRow({ name: 'Dana Sorkin', email: 'dana@example.com', timestamp: '3/8/2020' })],
      }).client,
    })

    const card = within(await cardFor('Time in the community'))
    expect(card.getByText(/1 of 2 members \(50%\)/)).toBeInTheDocument()
  })

  it('should show a title it could not read rather than dropping the member', async () => {
    renderSection({
      sheetsClient: sheetWith({
        members: [sheetMember({ name: 'Ari Ben-Ami', mail: 'ari@example.com', title: 'Chief Vibes Officer' })],
      }).client,
    })

    const card = within(await cardFor('Discipline'))
    expect(card.getByText(/1 of 1 members \(100%\)/)).toBeInTheDocument()
  })

  it('should count two spellings of one company as one company', async () => {
    renderSection({
      sheetsClient: sheetWith({
        members: [
          sheetMember({ name: 'Dana Sorkin', mail: 'dana@example.com', company: 'Playtika' }),
          sheetMember({ name: 'Tomer Reznik', mail: 'tomer@example.com', company: 'playtika' }),
        ],
      }).client,
    })
    await cardFor('Top companies')

    expect(screen.getByText(/Showing all 1 company spelling/)).toBeInTheDocument()
  })

  it('should say industry is not built rather than guessing it from company names', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA] }).client })

    const card = within(await cardFor('Industry'))
    expect(card.getByText(/Not built/)).toBeInTheDocument()
  })

  it('should name the tab that could not be read and offer the read again', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValueOnce(
        new SheetsRequestError({ range: 'Members!A1:Z', status: 500, detail: 'boom' }),
      )
      .mockRejectedValueOnce(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 500, detail: 'boom' }),
      )
    const sheet = sheetWith({ members: [DANA] })
    const failingClient: SheetsClient = { ...sheet.client, readRange }
    const { rerender } = renderSection({ sheetsClient: failingClient })

    expect(await screen.findByRole('alert')).toHaveTextContent(/tab could not be read/)

    rerender(<OverviewSection sheetsClient={sheet.client} onSessionExpired={vi.fn()} />)

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })

  it('should let a failed read be tried again', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Members!A1:Z', status: 500, detail: 'boom' }),
      )
    renderSection({ sheetsClient: { ...sheetWith({ members: [DANA] }).client, readRange } })
    await screen.findByRole('alert')
    const callsBeforeRetry = readRange.mock.calls.length

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(readRange.mock.calls.length).toBeGreaterThan(callsBeforeRetry)
    })
  })

  it('should hand an expired session back to the caller instead of showing an error', async () => {
    const onSessionExpired = vi.fn()
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Members!A1:Z', status: 401, detail: 'expired' }),
      )
    renderSection({
      sheetsClient: { ...sheetWith({ members: [DANA] }).client, readRange },
      onSessionExpired,
    })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalled()
    })
  })

  it('should draw the charts without crashing on a member who has no title at all', async () => {
    renderSection({
      sheetsClient: sheetWith({
        members: [sheetMember({ name: 'Roni Halperin', mail: 'roni@example.com', title: '' })],
      }).client,
    })

    const card = within(await cardFor('Seniority'))
    expect(card.getByText(/1 of 1 members \(100%\)/)).toBeInTheDocument()
  })

  it('should show a member the value behind a bar when they point at it', async () => {
    renderSection({ sheetsClient: sheetWith({ members: [DANA, TOMER, UNRECORDED] }).client })
    const card = within(await cardFor('Discipline'))

    await userEvent.hover(card.getByRole('listitem', { name: /Engineering/ }))

    expect(card.getByText('3 members (100%)')).toBeInTheDocument()
  })
})
