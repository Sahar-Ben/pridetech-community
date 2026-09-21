import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommunityWorkspace } from './CommunityWorkspace'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../testing/sheetsClientFactory'

const renderWorkspace = (
  overrides: Partial<Parameters<typeof CommunityWorkspace>[0]> = {},
) => {
  const props = {
    sheetsClient: createFakeSheetsClient({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
      memberRows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Dana Sorkin', mail: 'dana@example.com' }),
      ],
    }),
    onSessionExpired: vi.fn(),
    onChangeSpreadsheet: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  }
  render(<CommunityWorkspace {...props} />)
  return props
}

describe('CommunityWorkspace', () => {
  it('should display the community name', () => {
    renderWorkspace()

    expect(screen.getByRole('heading', { name: 'PrideTech Community' })).toBeInTheDocument()
  })

  it('should open on the Leads section', () => {
    renderWorkspace()

    expect(screen.getByRole('button', { name: 'Leads' })).toHaveAttribute('aria-current', 'page')
  })

  it('should show the applications read from the spreadsheet', async () => {
    renderWorkspace()

    expect(await screen.findByRole('heading', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.getByText('Noa Feldman')).toBeInTheDocument()
  })

  it('should switch to Members when the Members nav item is clicked', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Members' }))

    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Applications' })).not.toBeInTheDocument()
  })

  it('should switch to Events when the Events nav item is clicked', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument()
  })

  it('should mark the current section with aria-current once it changes', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(screen.getByRole('button', { name: 'Events' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Leads' })).not.toHaveAttribute('aria-current')
  })

  it('should list the community in the Members section', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Members' }))

    const membersTable = within(await screen.findByRole('table', { name: /members/i }))
    expect(membersTable.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('should let a member be opened from the Members section', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Members' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Dana Sorkin' }))

    expect(screen.getByRole('heading', { name: 'Dana Sorkin' })).toBeInTheDocument()
  })

  it('should open an event onto its registrants', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await userEvent.click(screen.getByRole('button', { name: 'Summer Rooftop Social' }))

    const registrants = within(screen.getByRole('table', { name: /registrants/i }))
    expect(registrants.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('should warn that the check-in screen records nothing', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pride Month Panel' }))
    await userEvent.click(screen.getByRole('button', { name: /check in at the door/i }))

    expect(screen.getByText(/not being recorded anywhere/i)).toBeInTheDocument()
  })

  it('should say the Events section is invented, because it still is', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(screen.getByText(/every event below is invented/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing in this section is read from your spreadsheet/i)).toBeInTheDocument()
  })

  it('should not call the Members section sample data, now that it reads the sheet', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Members' }))
    await screen.findByRole('table', { name: /members/i })

    expect(screen.queryByText(/is invented/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/read from your spreadsheet/i)).not.toBeInTheDocument()
  })

  it('should not call the Applications section sample data, because it is real', async () => {
    renderWorkspace()
    await screen.findByText('Noa Feldman')

    expect(screen.queryByText(/is invented/i)).not.toBeInTheDocument()
  })

  it('should let the reviewer choose a different spreadsheet', async () => {
    const { onChangeSpreadsheet } = renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: /change spreadsheet/i }))

    expect(onChangeSpreadsheet).toHaveBeenCalledTimes(1)
  })

  it('should let the reviewer sign out', async () => {
    const { onSignOut } = renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
