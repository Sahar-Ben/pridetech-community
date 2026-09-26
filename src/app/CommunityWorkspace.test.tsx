import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommunityWorkspace } from './CommunityWorkspace'
import {
  ATTENDANCE_HEADINGS,
  ATTENDANCE_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_HEADINGS,
  EVENT_SHEETS_TAB_NAME,
} from '../features/events/eventRegistryTabs'
import { createFakeResponseSheetAccess } from '../testing/eventsRegistryFactory'
import { createFakeSheet } from '../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../testing/sheetsClientFactory'

const PRIDE_PANEL_ROW = [
  'evt-1',
  'Pride Month Panel',
  '2026-06-24',
  'Quillon Cloud',
  'Quillon Cloud auditorium, Herzliya',
  '',
  'Yes',
  'No',
  'No',
  '',
]

const buildDashboard = ({ eventRows = [PRIDE_PANEL_ROW] }: { eventRows?: readonly (readonly string[])[] } = {}) =>
  createFakeSheet({
    tabs: {
      Leads: [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
      Members: [MEMBERS_HEADER_ROW, memberRow({ name: 'Dana Sorkin', mail: 'dana@example.com' })],
      [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS], ...eventRows],
      [EVENT_SHEETS_TAB_NAME]: [[...EVENT_SHEETS_HEADINGS]],
      [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]],
    },
  })

const renderWorkspace = (
  overrides: Partial<Parameters<typeof CommunityWorkspace>[0]> = {},
) => {
  const props = {
    sheetsClient: buildDashboard().client,
    responseSheetAccess: createFakeResponseSheetAccess(),
    onSessionExpired: vi.fn(),
    onChangeSpreadsheet: vi.fn(),
    onSignOut: vi.fn(),
    spreadsheetName: undefined,
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

  it('should open on the Overview section', () => {
    renderWorkspace()

    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
  })

  it('should show the member distributions the Overview is for', async () => {
    renderWorkspace()

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gender' })).toBeInTheDocument()
  })

  it('should switch to Leads when the Leads nav item is clicked', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Leads' }))

    expect(await screen.findByRole('heading', { name: 'Applications' })).toBeInTheDocument()
  })

  it('should show the applications read from the spreadsheet', async () => {
    renderWorkspace()
    await userEvent.click(screen.getByRole('button', { name: 'Leads' }))

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

    expect(await screen.findByRole('heading', { name: 'Events' })).toBeInTheDocument()
  })

  it('should list the events read from the Events tab of the spreadsheet', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(
      await screen.findByRole('heading', { name: 'Pride Month Panel' }),
    ).toBeInTheDocument()
  })

  it('should mark the current section with aria-current once it changes', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(screen.getByRole('button', { name: 'Events' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current')
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

  it('should open an event with no response sheet onto a note saying to attach one', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Pride Month Panel' }))

    expect(screen.getByText(/no response sheet is attached yet/i)).toBeInTheDocument()
  })

  it('should say the check-in screen saves to the Attendance tab', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Pride Month Panel' }))
    await userEvent.click(screen.getByRole('button', { name: /check in at the door/i }))

    expect(await screen.findByText(/saved to the attendance tab/i)).toBeInTheDocument()
  })

  it('should no longer call the whole Events section invented, now that its events are read', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await screen.findByRole('heading', { name: 'Pride Month Panel' })

    expect(screen.queryByText(/every event below is invented/i)).not.toBeInTheDocument()
  })

  it('should no longer warn that check-ins are not recorded', async () => {
    renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))
    await screen.findByRole('heading', { name: 'Pride Month Panel' })

    expect(screen.queryByText(/check-ins are not recorded/i)).not.toBeInTheDocument()
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
    await userEvent.click(screen.getByRole('button', { name: 'Leads' }))
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

describe('CommunityWorkspace, where the account actions live', () => {
  it('should keep both account actions in the sidebar rather than over the work', () => {
    renderWorkspace()

    const navigation = screen.getByRole('navigation', { name: /sections/i })

    expect(
      within(navigation).getByRole('button', { name: /change spreadsheet/i }),
    ).toBeInTheDocument()
    expect(within(navigation).getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /sign out/i })).toHaveLength(1)
  })

  it('should still change the spreadsheet from its new home', async () => {
    const { onChangeSpreadsheet } = renderWorkspace()

    await userEvent.click(screen.getByRole('button', { name: /change spreadsheet/i }))

    expect(onChangeSpreadsheet).toHaveBeenCalledOnce()
  })

  it('should name the spreadsheet it is working against when that name is known', () => {
    renderWorkspace({ spreadsheetName: 'PrideTech WRITE TEST' })

    expect(screen.getByText('PrideTech WRITE TEST')).toBeInTheDocument()
  })
})
