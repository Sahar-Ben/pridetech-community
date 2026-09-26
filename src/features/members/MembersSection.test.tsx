import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { MEMBERS_HEADER_ROW } from '../../testing/sheetsClientFactory'
import { MembersSection } from './MembersSection'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import type { ResponseSheetAccess } from '../events/responseSheetAccess'
import {
  ATTENDANCE_HEADINGS,
  EVENTS_HEADINGS,
  EVENT_SHEETS_HEADINGS,
} from '../events/eventRegistryTabs'
import { createFakeResponseSheetAccess } from '../../testing/eventsRegistryFactory'

const columnOf = (header: string): number => MEMBERS_HEADER_ROW.indexOf(header)

type SheetMember = {
  name?: string
  company?: string
  gender?: string
  mail?: string
  phone?: string
  city?: string
  status?: string
  removalReason?: string
}

const sheetMember = ({
  name = '',
  company = '',
  gender = '',
  mail = '',
  phone = '',
  city = '',
  status = '',
  removalReason = '',
}: SheetMember): string[] => [
  name,
  company,
  'Engineer',
  gender,
  mail,
  'Yes',
  '1st',
  phone,
  city,
  '',
  '',
  '',
  '',
  status,
  removalReason,
  '2024-01-01',
  '',
  '',
]

const DANA = sheetMember({
  name: 'Dana Sorkin',
  company: 'Ridgeway Systems',
  gender: 'F',
  mail: 'dana@example.com',
  phone: '0501234567',
  city: 'Tel Aviv',
})

const TOMER = sheetMember({
  name: 'Tomer Reznik',
  company: 'Palewood Analytics',
  gender: 'M',
  mail: 'tomer@example.com',
})

const NAMELESS = sheetMember({ mail: 'unknown@example.com' })

const MAILLESS = sheetMember({ name: 'Roni Halperin', city: 'Haifa' })

const FORMER = sheetMember({
  name: 'Gaya Ronen',
  mail: 'gaya@example.com',
  status: 'Ex-member',
  removalReason: 'Moved abroad',
})

const membersSheet = (rows: readonly (readonly string[])[]): FakeSheet =>
  createFakeSheet({ tabs: { Members: [MEMBERS_HEADER_ROW, ...rows] } })

const renderSection = ({
  sheetsClient,
  onSessionExpired = vi.fn(),
  access = createFakeResponseSheetAccess(),
}: {
  sheetsClient: SheetsClient
  onSessionExpired?: () => void
  access?: ResponseSheetAccess
}) =>
  render(
    <MembersSection
      onSessionExpired={onSessionExpired}
      responseSheetAccess={access}
      sheetsClient={sheetsClient}
    />,
  )

const listedNames = (): readonly string[] =>
  within(screen.getByRole('table', { name: /members/i }))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '')

const waitForNames = async (names: readonly string[]): Promise<void> => {
  await waitFor(() => {
    expect(listedNames()).toEqual(names)
  })
}

const savedRow = ({ sheet, rowNumber }: { sheet: FakeSheet; rowNumber: number }) =>
  sheet.rowsOf('Members')[rowNumber - 1] ?? []

const openMember = async (name: string): Promise<void> => {
  await userEvent.click(await screen.findByRole('button', { name }))
}

const startEditing = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
}

const retype = async ({ label, value }: { label: string; value: string }): Promise<void> => {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, value)
}

describe('MembersSection', () => {
  it('should list the members the sheet holds', async () => {
    renderSection({ sheetsClient: membersSheet([TOMER, DANA]).client })

    await waitForNames(['Dana Sorkin', 'Tomer Reznik'])
  })

  it('should treat a member whose Status cell is blank as active', async () => {
    renderSection({ sheetsClient: membersSheet([DANA]).client })

    await waitForNames(['Dana Sorkin'])
  })

  it('should leave a recorded ex-member out of the active list', async () => {
    renderSection({ sheetsClient: membersSheet([DANA, FORMER]).client })

    await waitForNames(['Dana Sorkin'])
  })

  it('should show a recorded ex-member when the filter asks for one', async () => {
    renderSection({ sheetsClient: membersSheet([DANA, FORMER]).client })
    await waitForNames(['Dana Sorkin'])

    await userEvent.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'Ex-member')

    await waitForNames(['Gaya Ronen'])
  })

  it('should report the share of active members whose gender was never filled in', async () => {
    renderSection({ sheetsClient: membersSheet([DANA, TOMER, NAMELESS, MAILLESS]).client })

    expect(await screen.findByText(/50% not recorded \(2\)/)).toBeInTheDocument()
  })

  it('should show a member whose Mail cell is blank', async () => {
    renderSection({ sheetsClient: membersSheet([DANA, MAILLESS]).client })

    await waitForNames(['Dana Sorkin', 'Roni Halperin'])
  })

  it('should keep searching when a member has no address to search', async () => {
    renderSection({ sheetsClient: membersSheet([DANA, MAILLESS]).client })
    await waitForNames(['Dana Sorkin', 'Roni Halperin'])

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'dana@example.com')

    await waitForNames(['Dana Sorkin'])
  })

  it('should say which tab could not be read rather than showing an empty directory', async () => {
    const sheetsClient: SheetsClient = {
      ...membersSheet([DANA]).client,
      readRange: vi
        .fn()
        .mockRejectedValue(
          new SheetsRequestError({ range: 'Members!A1:Z', status: 500, detail: 'boom' }),
        ),
    }
    renderSection({ sheetsClient })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Members tab could not be read/)
    expect(screen.queryByRole('table', { name: /members/i })).not.toBeInTheDocument()
  })

  it('should hand an expired session back to the caller instead of showing an error', async () => {
    const onSessionExpired = vi.fn()
    const sheetsClient: SheetsClient = {
      ...membersSheet([DANA]).client,
      readRange: vi
        .fn()
        .mockRejectedValue(
          new SheetsRequestError({ range: 'Members!A1:Z', status: 401, detail: 'expired' }),
        ),
    }
    renderSection({ sheetsClient, onSessionExpired })

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalled()
    })
  })

  it('should write an edited field to the member row', async () => {
    const sheet = membersSheet([DANA])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    await retype({ label: 'City', value: 'Haifa' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(savedRow({ sheet, rowNumber: 2 })[columnOf('City')]).toBe('Haifa')
    })
  })

  it('should leave the phone number as it stands when the edit was about the city', async () => {
    const sheet = membersSheet([DANA])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    await retype({ label: 'City', value: 'Haifa' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(savedRow({ sheet, rowNumber: 2 })[columnOf('Phone')]).toBe('0501234567')
    })
  })

  it('should show the edited value in the directory once the sheet has taken it', async () => {
    const sheet = membersSheet([DANA])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    await retype({ label: 'Name', value: 'Dana Sorkin-Levi' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByRole('heading', { name: 'Dana Sorkin-Levi' })).toBeInTheDocument()
  })

  it('should keep the form open with the reason on it when the sheet refuses the write', async () => {
    const sheet = membersSheet([DANA])
    const sheetsClient: SheetsClient = {
      ...sheet.client,
      updateCells: vi
        .fn()
        .mockRejectedValue(
          new SheetsRequestError({ range: 'Members!I2', status: 500, detail: 'backend error' }),
        ),
    }
    renderSection({ sheetsClient })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    await retype({ label: 'City', value: 'Haifa' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/backend error/)
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toHaveValue('Haifa')
  })

  it('should keep the form open when the row has moved underneath the edit', async () => {
    const sheet = membersSheet([DANA])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    sheet.replaceRows({
      tabName: 'Members',
      rows: [MEMBERS_HEADER_ROW, TOMER, DANA],
    })
    await retype({ label: 'City', value: 'Haifa' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/changed while/i)
    expect(screen.getByLabelText('City')).toHaveValue('Haifa')
  })

  it('should show a member with no address as having none rather than linking to nobody', async () => {
    renderSection({ sheetsClient: membersSheet([MAILLESS]).client })
    await waitForNames(['Roni Halperin'])

    await openMember('Roni Halperin')

    const emailTerm = screen.getByText('Email')
    expect(emailTerm.nextElementSibling).toHaveTextContent('Not recorded')
    expect(screen.queryByRole('link', { name: /mailto/i })).not.toBeInTheDocument()
  })

  it('should let a member with no address be edited without inventing one', async () => {
    const sheet = membersSheet([MAILLESS])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Roni Halperin'])

    await openMember('Roni Halperin')
    await startEditing()
    await retype({ label: 'Phone', value: '0501234567' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(savedRow({ sheet, rowNumber: 2 })[columnOf('Phone')]).toBe('0501234567')
    })
  })

  it('should never claim an edit is only stored in this browser', async () => {
    const sheet = membersSheet([DANA])
    renderSection({ sheetsClient: sheet.client })
    await waitForNames(['Dana Sorkin'])

    await openMember('Dana Sorkin')
    await startEditing()
    await retype({ label: 'City', value: 'Haifa' })
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(savedRow({ sheet, rowNumber: 2 })[columnOf('City')]).toBe('Haifa')
    })
    expect(screen.queryByText(/in this browser only/i)).not.toBeInTheDocument()
  })
})

describe('MembersSection event history', () => {
  const eventRow = (id: string, name: string, date: string) => [
    id, name, date, '', '', '', 'No', 'No', 'No', '',
  ]
  const sheetRow = (eventId: string, spreadsheetId: string) => [
    eventId,
    spreadsheetId,
    'Form Responses 1',
    'main',
    '{"timestamp":"A","name":"B","email":"C","company":null,"jobTitle":null}',
  ]
  const communitySheet = (attendance: readonly (readonly string[])[] = []) =>
    createFakeSheet({
      tabs: {
        Members: [MEMBERS_HEADER_ROW, DANA, TOMER],
        Events: [
          [...EVENTS_HEADINGS],
          eventRow('evt-play', 'PrideTech Play', '2026-09-16'),
          eventRow('evt-tiktok', 'TikTok', '2026-06-08'),
        ],
        'Event sheets': [
          [...EVENT_SHEETS_HEADINGS],
          sheetRow('evt-play', 'play-rsvp'),
          sheetRow('evt-tiktok', 'tiktok-rsvp'),
        ],
        Attendance: [[...ATTENDANCE_HEADINGS], ...attendance],
      },
    })
  const rsvpAccess = () =>
    createFakeResponseSheetAccess({
      readRows: vi.fn(async ({ spreadsheetId }: { spreadsheetId: string }) =>
        await Promise.resolve(
          spreadsheetId === 'play-rsvp'
            ? [['Timestamp', 'Name', 'Email'], ['', 'Dana Sorkin', 'DANA@example.com']]
            : [['Timestamp', 'Name', 'Email'], ['', 'Tomer Reznik', 'tomer@example.com']],
        ),
      ),
    })

  it('should list the events a member registered for', async () => {
    renderSection({ sheetsClient: communitySheet().client, access: rsvpAccess() })

    await openMember('Dana Sorkin')

    const events = await screen.findByRole('list', { name: 'Events' })
    expect(within(events).getByText('PrideTech Play')).toBeInTheDocument()
    expect(within(events).queryByText('TikTok')).not.toBeInTheDocument()
  })

  it('should say attended for a member checked in at the door', async () => {
    renderSection({
      sheetsClient: communitySheet([
        ['evt-play', 'dana@example.com', 'Dana Sorkin', 'Attended', '2026-09-16T18:00:00Z', ''],
      ]).client,
      access: rsvpAccess(),
    })

    await openMember('Dana Sorkin')

    expect(await screen.findByText(/registered for 1 event · attended 1/i)).toBeInTheDocument()
  })

  it('should read the events once, however many members are opened', async () => {
    const access = rsvpAccess()
    renderSection({ sheetsClient: communitySheet().client, access })

    await openMember('Dana Sorkin')
    await screen.findByRole('list', { name: 'Events' })
    await userEvent.click(screen.getByRole('button', { name: /back to members/i }))
    await openMember('Tomer Reznik')
    await screen.findByRole('list', { name: 'Events' })

    expect(access.readRows).toHaveBeenCalledTimes(2)
  })
})
