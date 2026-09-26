import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventsSection } from './EventsSection'
import {
  ATTENDANCE_HEADINGS,
  ATTENDANCE_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_HEADINGS,
  EVENT_SHEETS_TAB_NAME,
} from './eventRegistryTabs'
import { createFakeResponseSheetAccess } from '../../testing/eventsRegistryFactory'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { MEMBERS_HEADER_ROW, memberRow } from '../../testing/sheetsClientFactory'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const MEMBERS_TAB = {
  Members: [MEMBERS_HEADER_ROW, memberRow({ name: 'Dana Sorkin', mail: 'dana@example.com' })],
}

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

const buildSheet = (tabs: Readonly<Record<string, readonly (readonly string[])[]>>): FakeSheet =>
  createFakeSheet({ tabs: { ...MEMBERS_TAB, ...tabs } })

const readyTabs = ({
  eventRows = [PRIDE_PANEL_ROW],
  attachedRows = [],
}: {
  eventRows?: readonly (readonly string[])[]
  attachedRows?: readonly (readonly string[])[]
} = {}) => ({
  [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS], ...eventRows],
  [EVENT_SHEETS_TAB_NAME]: [[...EVENT_SHEETS_HEADINGS], ...attachedRows],
  [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]],
})

const EMPTY_TABS = {
  [EVENTS_TAB_NAME]: [],
  [EVENT_SHEETS_TAB_NAME]: [],
  [ATTENDANCE_TAB_NAME]: [],
}

const renderSection = ({
  sheet,
  access = createFakeResponseSheetAccess(),
}: {
  sheet: FakeSheet
  access?: ResponseSheetAccess
}) => {
  render(
    <EventsSection
      onSessionExpired={vi.fn()}
      responseSheetAccess={access}
      sheetsClient={sheet.client}
    />,
  )
  return sheet
}

describe('EventsSection, where the spreadsheet has never held an event', () => {
  it('should offer to add the three tabs rather than add them on load', async () => {
    const sheet = renderSection({ sheet: buildSheet({}) })

    expect(await screen.findByText(/this will add 3 tabs/i)).toBeInTheDocument()
    expect(sheet.tabNames()).toEqual(['Members'])
  })

  it('should say what each tab will hold before it is added', async () => {
    renderSection({ sheet: buildSheet({}) })

    expect(await screen.findByText(/one row per event/i)).toBeInTheDocument()
    expect(screen.getByText(/one row per response sheet attached to an event/i)).toBeInTheDocument()
    expect(screen.getByText(/one row per person per event/i)).toBeInTheDocument()
  })

  it('should suggest trying it on a copy first', async () => {
    renderSection({ sheet: buildSheet({}) })

    expect(await screen.findByText(/on a copy first/i)).toBeInTheDocument()
  })

  it('should add the tabs with their headings once the organiser confirms', async () => {
    const sheet = renderSection({ sheet: buildSheet({}) })

    await userEvent.click(await screen.findByRole('button', { name: /set up the tabs/i }))

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[0]).toEqual([...EVENT_SHEETS_HEADINGS])
    expect(sheet.rowsOf(ATTENDANCE_TAB_NAME)[0]).toEqual([...ATTENDANCE_HEADINGS])
  })

  it('should show the empty events list once the tabs are there', async () => {
    renderSection({ sheet: buildSheet({}) })

    await userEvent.click(await screen.findByRole('button', { name: /set up the tabs/i }))

    expect(await screen.findByText(/no events yet/i)).toBeInTheDocument()
  })

  it('should say what was refused when Google will not add the tabs', async () => {
    const sheet = buildSheet({})
    sheet.client.addTabs = vi.fn().mockRejectedValue(new Error('Caller lacks permission'))
    renderSection({ sheet })

    await userEvent.click(await screen.findByRole('button', { name: /set up the tabs/i }))

    expect(await screen.findByText(/nothing was added/i)).toBeInTheDocument()
  })
})

describe('EventsSection, where the organiser made the tabs by hand and left them empty', () => {
  it('should say the tabs are already there rather than offer to add them', async () => {
    renderSection({ sheet: buildSheet(EMPTY_TABS) })

    expect(await screen.findByText(/already there and empty/i)).toBeInTheDocument()
    expect(screen.queryByText(/this will add/i)).not.toBeInTheDocument()
  })

  it('should write the heading rows without creating the tabs again', async () => {
    const sheet = renderSection({ sheet: buildSheet(EMPTY_TABS) })

    await userEvent.click(await screen.findByRole('button', { name: /set up the tabs/i }))

    expect(sheet.client.addTabs).not.toHaveBeenCalled()
    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
  })

  it('should treat a tab holding only blank cells as empty', async () => {
    const sheet = buildSheet({ ...EMPTY_TABS, [EVENTS_TAB_NAME]: [['', '  ']] })
    renderSection({ sheet })

    await userEvent.click(await screen.findByRole('button', { name: /set up the tabs/i }))

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
  })
})

describe('EventsSection, where a tab of that name holds something else', () => {
  const guestList = {
    ...EMPTY_TABS,
    [EVENTS_TAB_NAME]: [
      ['Event', 'When'],
      ['Opening night', '16.4.25'],
    ],
  }

  it('should name the heading that is missing rather than offer to rewrite the row', async () => {
    renderSection({ sheet: buildSheet(guestList) })

    expect(await screen.findByText(/no column headed Event ID/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /set up the tabs/i })).not.toBeInTheDocument()
  })

  it('should leave every cell of that tab exactly as it was', async () => {
    const sheet = renderSection({ sheet: buildSheet(guestList) })

    await screen.findByText(/cannot be set up/i)

    expect(sheet.writes).toEqual([])
    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]).toEqual(['Opening night', '16.4.25'])
  })
})

describe('EventsSection, where the registry is ready', () => {
  it('should list the events read from the Events tab', async () => {
    renderSection({ sheet: buildSheet(readyTabs()) })

    expect(await screen.findByRole('heading', { name: 'Pride Month Panel' })).toBeInTheDocument()
  })

  it('should say plainly that check-ins at those events are not recorded yet', async () => {
    renderSection({ sheet: buildSheet(readyTabs()) })

    expect(await screen.findByText(/check-ins are not recorded yet/i)).toBeInTheDocument()
  })

  it('should report a row that carries no event id rather than drop it quietly', async () => {
    renderSection({
      sheet: buildSheet(readyTabs({ eventRows: [PRIDE_PANEL_ROW, ['', 'Nameless evening']] })),
    })

    expect(await screen.findByText(/1 row in the Events tabs needs a look/i)).toBeInTheDocument()
  })

  it('should write a new event to the Events tab and list it', async () => {
    const sheet = renderSection({ sheet: buildSheet(readyTabs({ eventRows: [] })) })

    await userEvent.click(await screen.findByRole('button', { name: /add event/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Board Games Night')
    await userEvent.type(screen.getByLabelText(/^date/i), '2026-10-15')
    await userEvent.type(screen.getByLabelText(/^location/i), 'Pell and Quarry, Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    expect(await screen.findByRole('heading', { name: 'Board Games Night' })).toBeInTheDocument()
    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]?.[1]).toBe('Board Games Night')
  })

  it('should give the new event an id of its own, never its row number', async () => {
    const sheet = renderSection({ sheet: buildSheet(readyTabs({ eventRows: [] })) })

    await userEvent.click(await screen.findByRole('button', { name: /add event/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Board Games Night')
    await userEvent.type(screen.getByLabelText(/^date/i), '2026-10-15')
    await userEvent.type(screen.getByLabelText(/^location/i), 'Pell and Quarry, Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    await screen.findByRole('heading', { name: 'Board Games Night' })

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]?.[0]).toMatch(/^evt-/)
  })

  it('should take an archived event out of the listing without removing its row', async () => {
    const sheet = renderSection({ sheet: buildSheet(readyTabs()) })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Archive Pride Month Panel' }),
    )

    expect(await screen.findByText(/attendance is kept/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pride Month Panel' })).not.toBeInTheDocument()
    expect(sheet.rowsOf(EVENTS_TAB_NAME)).toHaveLength(2)
  })
})

describe('EventsSection, attaching a response sheet', () => {
  const openPanel = async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Pride Month Panel' }))
    await userEvent.click(screen.getByRole('button', { name: /attach a response sheet/i }))
  }

  it('should record the sheet, its role and the mapping the organiser confirmed', async () => {
    const sheet = renderSection({ sheet: buildSheet(readyTabs()) })

    await openPanel()
    await userEvent.click(await screen.findByRole('button', { name: /attach this sheet/i }))

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]).toEqual([
      'evt-1',
      'responses-1',
      'Form Responses 1',
      'main',
      '{"timestamp":"A","name":"B","email":"C","company":"D","jobTitle":null}',
    ])
  })

  it('should attach a sheet whose timestamp column has a blank heading', async () => {
    const sheet = buildSheet(readyTabs())
    renderSection({
      sheet,
      access: createFakeResponseSheetAccess({
        readHeaderRow: vi.fn(async () => await Promise.resolve(['', 'Name', 'E-Mail'])),
      }),
    })

    await openPanel()
    await userEvent.click(await screen.findByRole('button', { name: /attach this sheet/i }))

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]?.[4]).toBe(
      '{"timestamp":null,"name":"B","email":"C","company":null,"jobTitle":null}',
    )
  })

  it('should let the organiser name the column under a blank heading', async () => {
    const sheet = buildSheet(readyTabs())
    renderSection({
      sheet,
      access: createFakeResponseSheetAccess({
        readHeaderRow: vi.fn(async () => await Promise.resolve(['', 'Name', 'E-Mail'])),
      }),
    })

    await openPanel()
    await userEvent.selectOptions(
      await screen.findByLabelText(/timestamp column/i),
      'A \u{2014} (no heading)',
    )
    await userEvent.click(screen.getByRole('button', { name: /attach this sheet/i }))

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]?.[4]).toContain('"timestamp":"A"')
  })

  it('should attach a sheet with no email column at all, and record that it has none', async () => {
    const sheet = buildSheet(readyTabs())
    renderSection({
      sheet,
      access: createFakeResponseSheetAccess({
        readHeaderRow: vi.fn(
          async () => await Promise.resolve(['Timestamp', 'Full Name', 'Your Company']),
        ),
      }),
    })

    await openPanel()

    expect(await screen.findByText(/this sheet has no email column/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /attach this sheet/i }))

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]?.[4]).toContain('"email":null')
  })

  it('should read the mapping back out of the registry it just wrote', async () => {
    renderSection({
      sheet: buildSheet(readyTabs()),
      access: createFakeResponseSheetAccess({
        readHeaderRow: vi.fn(
          async () => await Promise.resolve(['Timestamp', 'Full Name', 'Your Company']),
        ),
      }),
    })

    await openPanel()
    await userEvent.click(await screen.findByRole('button', { name: /attach this sheet/i }))

    /* The panel is now showing the row it wrote, read back through the
       registry rather than remembered from the form. */
    expect(
      await screen.findByText(/no email column: these people will have to be matched/i),
    ).toBeInTheDocument()
  })

  it('should ask which tab holds the responses when the picked file has several', async () => {
    renderSection({
      sheet: buildSheet(readyTabs()),
      access: createFakeResponseSheetAccess({
        readTabNames: vi.fn(async () => await Promise.resolve(['Form Responses 1', 'Waiting'])),
      }),
    })

    await openPanel()

    expect(await screen.findByText(/which tab of/i)).toBeInTheDocument()
  })

  it('should let one event carry a waiting list kept on its own sheet', async () => {
    const sheet = buildSheet(readyTabs())
    renderSection({ sheet })

    await openPanel()
    await userEvent.selectOptions(
      await screen.findByLabelText(/what this sheet is/i),
      'waiting list',
    )
    await userEvent.click(screen.getByRole('button', { name: /attach this sheet/i }))

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]?.[3]).toBe('waiting list')
  })

  it('should stay where it was when the organiser closed the picker without choosing', async () => {
    renderSection({
      sheet: buildSheet(readyTabs()),
      access: createFakeResponseSheetAccess({
        pickSpreadsheet: vi.fn(async () => await Promise.resolve(undefined)),
      }),
    })

    await openPanel()

    expect(
      await screen.findByRole('button', { name: /attach a response sheet/i }),
    ).toBeInTheDocument()
  })
})

const ATTACHED_PANEL_SHEET = [
  'evt-1',
  'responses-1',
  'Form Responses 1',
  'main',
  '{"timestamp":"A","name":"B","email":"C","company":"D","jobTitle":null}',
]

const RESPONSE_ROWS = [
  ['Timestamp', 'Name', 'Email', 'Company'],
  ['9/1/2026 10:00:00', 'Dana Sorkin', 'DANA@example.com', 'Quillon Cloud'],
  ['9/2/2026 11:00:00', 'Avi Levi', 'avi@example.com', 'Fennimore Labs'],
  ['9/3/2026 12:00:00', 'Dana Sorkin', 'dana@example.com', 'Quillon Cloud'],
]

const accessWithResponses = (overrides: Partial<ResponseSheetAccess> = {}) =>
  createFakeResponseSheetAccess({
    readRows: vi.fn(async () => await Promise.resolve(RESPONSE_ROWS)),
    ...overrides,
  })

const openPridePanel = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Pride Month Panel' }))
}

const registrantNames = async (): Promise<readonly string[]> => {
  const table = await screen.findByRole('table', { name: /registrants/i })
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '')
}

describe('EventsSection, reading who registered', () => {
  it('should not read any response sheet until an event is opened', async () => {
    const access = accessWithResponses()
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access,
    })

    expect(await screen.findByText(/open the event to read its registrants/i)).toBeInTheDocument()
    expect(access.readRows).not.toHaveBeenCalled()
  })

  it('should list the people on the attached response sheet when the event is opened', async () => {
    const access = accessWithResponses()
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access,
    })

    await openPridePanel()

    expect(await registrantNames()).toEqual(['Avi Levi', 'Dana Sorkin'])
    expect(access.readRows).toHaveBeenCalledWith({
      spreadsheetId: 'responses-1',
      sheetName: 'Form Responses 1',
    })
  })

  it('should count somebody who submitted twice once, and say so', async () => {
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access: accessWithResponses(),
    })

    await openPridePanel()

    expect(await screen.findByText(/2 registered/)).toBeInTheDocument()
    expect(screen.getByText(/1 repeat submission/i)).toBeInTheDocument()
  })

  it('should mark a registrant whose email is on the Members tab as a member', async () => {
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access: accessWithResponses(),
    })

    await openPridePanel()

    const table = await screen.findByRole('table', { name: /registrants/i })
    const danaRow = within(table).getByText('Dana Sorkin').closest('tr')
    expect(danaRow).not.toBeNull()
    expect(within(danaRow as HTMLElement).getByText(/member/i)).toBeInTheDocument()
  })

  it('should keep the list on the events listing once the event has been read', async () => {
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access: accessWithResponses(),
    })

    await openPridePanel()
    await registrantNames()
    await userEvent.click(screen.getByRole('button', { name: /back to events/i }))

    expect(await screen.findByText(/2 registered/)).toBeInTheDocument()
  })

  it('should read the sheet again when asked, for registrations that arrived since', async () => {
    const access = accessWithResponses()
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access,
    })
    await openPridePanel()
    await registrantNames()

    await userEvent.click(screen.getByRole('button', { name: /read the response sheets again/i }))

    await waitFor(() => expect(access.readRows).toHaveBeenCalledTimes(2))
  })

  it('should offer to give access to a sheet this organiser cannot open', async () => {
    const readRows = vi
      .fn()
      .mockRejectedValueOnce(new SheetsRequestError({ range: 'A1:Z', status: 403, detail: 'denied' }))
      .mockResolvedValue(RESPONSE_ROWS)
    const access = accessWithResponses({
      readRows,
      pickSpreadsheet: vi.fn(
        async () => await Promise.resolve({ spreadsheetId: 'responses-1', name: 'Pride RSVP' }),
      ),
    })
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access,
    })
    await openPridePanel()

    await userEvent.click(
      await screen.findByRole('button', { name: /give access to "form responses 1"/i }),
    )

    expect(await registrantNames()).toEqual(['Avi Levi', 'Dana Sorkin'])
  })

  it('should refuse a different file picked to give access, and read nothing', async () => {
    const readRows = vi
      .fn()
      .mockRejectedValue(new SheetsRequestError({ range: 'A1:Z', status: 403, detail: 'denied' }))
    const access = accessWithResponses({
      readRows,
      pickSpreadsheet: vi.fn(
        async () => await Promise.resolve({ spreadsheetId: 'other-file', name: 'Something else' }),
      ),
    })
    renderSection({
      sheet: buildSheet(readyTabs({ attachedRows: [ATTACHED_PANEL_SHEET] })),
      access,
    })
    await openPridePanel()

    await userEvent.click(
      await screen.findByRole('button', { name: /give access to "form responses 1"/i }),
    )

    expect(await screen.findByText(/that is a different file/i)).toBeInTheDocument()
    expect(readRows).toHaveBeenCalledTimes(1)
  })

  it('should read the registrants of a sheet as soon as it is attached', async () => {
    const access = accessWithResponses({
      readHeaderRow: vi.fn(async () => await Promise.resolve(RESPONSE_ROWS[0] ?? [])),
    })
    renderSection({ sheet: buildSheet(readyTabs()), access })

    await openPridePanel()
    await userEvent.click(await screen.findByRole('button', { name: /attach a response sheet/i }))
    await userEvent.click(await screen.findByRole('button', { name: /attach this sheet/i }))

    expect(await registrantNames()).toEqual(['Avi Levi', 'Dana Sorkin'])
  })
})
