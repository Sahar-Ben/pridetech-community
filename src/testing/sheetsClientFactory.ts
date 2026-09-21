import { vi } from 'vitest'
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

export const leadRow = ({
  name,
  email,
  status = '',
}: {
  name: string
  email: string
  status?: string
}): string[] => [
  '3/8/2025 14:25:20',
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

export const createFakeSheetsClient = ({
  rows = [LEADS_HEADER_ROW],
  readRange,
}: {
  rows?: readonly string[][]
  readRange?: SheetsClient['readRange']
} = {}): SheetsClient => ({
  readRange: readRange ?? vi.fn().mockResolvedValue(rows.map((row) => [...row])),
  appendRow: vi.fn().mockRejectedValue(new Error('writes are not wired up yet')),
  updateCell: vi.fn().mockRejectedValue(new Error('writes are not wired up yet')),
})
