import { vi } from 'vitest'
import {
  LEADS_TAB_NAME,
  MEMBERS_RANGE,
  MEMBERS_TAB_NAME,
} from '../features/applications/sheetTabs'
import type { SheetsClient } from '../sheets/sheetsClient'

export const LEADS_HEADER_ROW = [
  'Timestamp',
  'Name',
  'Job Title',
  'Company',
  'LinkedIn Profile (Link)',
  'E-Mail',
  'Phone Number',
  'Which city do you currently live in?',
  'Please select your areas of interest (you can choose multiple)',
  'Please provide your shirt size (for potential swag)',
  'Status',
]

/* The Reason column was added beside Status long after the form was built, and
   most of these fixtures predate it: a test that needs a reason written says so
   rather than every other test carrying a column it never reads. */
export const LEADS_HEADER_ROW_WITH_REASON = [...LEADS_HEADER_ROW, 'Reason']

export const MEMBERS_HEADER_ROW = [
  'Name',
  'Company',
  'Title',
  'Gender',
  'Mail',
  'Informed for membership',
  'Meetup',
  'Phone',
  'City',
  'LinkedIn',
  'Interests',
  'Shirt Size',
  'Notes',
  'Status',
  'Removal reason',
  'Approved at',
  'Previous removal reason',
  'Rejoined at',
]

export const leadRow = ({
  name,
  email,
  status = '',
  timestamp = '3/8/2025 14:25:20',
}: {
  name: string
  email: string
  status?: string
  timestamp?: string
}): string[] => [
  timestamp,
  name,
  'Backend Engineer',
  'Meadowlark Labs',
  'https://linkedin.com/in/example',
  email,
  '050-000-0000',
  'Tel Aviv',
  'AI',
  'M',
  status,
]

export const memberRow = ({
  name,
  mail,
  gender = 'F',
  status = 'Active',
  removalReason = '',
}: {
  name: string
  mail: string
  gender?: string
  status?: string
  removalReason?: string
}): string[] => [
  name,
  'Meadowlark Labs',
  'Backend Engineer',
  gender,
  mail,
  'Yes',
  '1st',
  '050-000-0000',
  'Tel Aviv',
  'https://linkedin.com/in/example',
  'AI',
  'M',
  '',
  status,
  removalReason,
  '2024-01-01',
  '',
  '',
]

/* The Leads screen reads two tabs, so the fake answers by range: a client that
   returned the lead rows for both would index leads as members and empty the queue. */
export const createFakeSheetsClient = ({
  spreadsheetId = 'test-spreadsheet-id',
  rows = [LEADS_HEADER_ROW],
  memberRows = [MEMBERS_HEADER_ROW],
  readRange,
  tabNames = [LEADS_TAB_NAME, MEMBERS_TAB_NAME],
}: {
  spreadsheetId?: string
  rows?: readonly string[][]
  memberRows?: readonly string[][]
  readRange?: SheetsClient['readRange']
  tabNames?: readonly string[]
} = {}): SheetsClient => ({
  spreadsheetId,
  readRange:
    readRange ??
    vi
      .fn()
      .mockImplementation(({ range }: { range: string }) =>
        Promise.resolve((range === MEMBERS_RANGE ? memberRows : rows).map((row) => [...row])),
      ),
  appendRow: vi.fn().mockRejectedValue(new Error('this fake client is for reads only')),
  updateCell: vi.fn().mockRejectedValue(new Error('this fake client is for reads only')),
  updateCells: vi.fn().mockRejectedValue(new Error('this fake client is for reads only')),
  readTabNames: vi.fn().mockResolvedValue([...tabNames]),
  addTabs: vi.fn().mockRejectedValue(new Error('this fake client is for reads only')),
})
