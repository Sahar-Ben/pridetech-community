import { vi } from 'vitest'
import type { EventRegistryWriter } from '../features/events/eventRegistryWriter'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'

/* A writer that settles without complaint, so a test about the listing is not
   also a test about the sheet. A test about a refused write replaces the one
   method it is about. */
export const createFakeEventRegistryWriter = (
  overrides: Partial<EventRegistryWriter> = {},
): EventRegistryWriter => ({
  addEvent: vi.fn(async () => await Promise.resolve()),
  saveEvent: vi.fn(async () => await Promise.resolve()),
  attachSheet: vi.fn(async () => await Promise.resolve()),
  ...overrides,
})

export const createFakeResponseSheetAccess = (
  overrides: Partial<ResponseSheetAccess> = {},
): ResponseSheetAccess => ({
  pickSpreadsheet: vi.fn(
    async () => await Promise.resolve({ spreadsheetId: 'responses-1', name: 'Responses' }),
  ),
  readTabNames: vi.fn(async () => await Promise.resolve(['Form Responses 1'])),
  readHeaderRow: vi.fn(
    async () => await Promise.resolve(['Timestamp', 'Name', 'Email', 'Company']),
  ),
  ...overrides,
})
