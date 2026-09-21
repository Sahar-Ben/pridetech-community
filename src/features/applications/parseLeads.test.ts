import { describe, expect, it } from 'vitest'
import { parseLeads } from './parseLeads'

const HEADER_ROW = [
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

const dataRow = (cells: readonly string[]): string[] => [...cells]

describe('parseLeads', () => {
  it('should parse a complete row into a lead', () => {
    const [lead] = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow([
          '3/8/2025 14:25:20',
          'Noa Feldman',
          'Director of Marketing',
          'Meadowlark Labs',
          'https://linkedin.com/in/noa-example',
          'Noa.Feldman@example.com',
          '972500000001',
          'Tel Aviv',
          'AI, Marketing',
          'M',
          '',
        ]),
      ],
    })

    expect(lead).toEqual({
      rowNumber: 2,
      name: 'Noa Feldman',
      jobTitle: 'Director of Marketing',
      company: 'Meadowlark Labs',
      linkedIn: 'https://linkedin.com/in/noa-example',
      email: 'noa.feldman@example.com',
      phone: '972500000001',
      city: 'Tel Aviv',
      interests: 'AI, Marketing',
      status: 'pending',
    })
  })

  it('should lowercase the email so matching is case-insensitive', () => {
    const [lead] = parseLeads({
      rows: [HEADER_ROW, dataRow(['t', 'A', 'B', 'C', 'D', 'MiXeD@Example.COM', '', '', '', '', ''])],
    })

    expect(lead?.email).toBe('mixed@example.com')
  })

  it('should treat an empty Status cell as pending', () => {
    const [lead] = parseLeads({ rows: [HEADER_ROW, dataRow(['t', 'A', '', '', '', 'a@b.com'])] })

    expect(lead?.status).toBe('pending')
  })

  it('should read Approved and Declined statuses', () => {
    const leads = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'A', '', '', '', 'a@b.com', '', '', '', '', 'Approved']),
        dataRow(['t', 'B', '', '', '', 'b@b.com', '', '', '', '', 'Declined']),
      ],
    })

    expect(leads.map((lead) => lead.status)).toEqual(['approved', 'declined'])
  })

  it('should give each lead its 1-based sheet row number so writes target the right row', () => {
    const leads = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'A', '', '', '', 'a@b.com']),
        dataRow(['t', 'B', '', '', '', 'b@b.com']),
      ],
    })

    expect(leads.map((lead) => lead.rowNumber)).toEqual([2, 3])
  })

  it('should keep the row number of a skipped row, so later rows still point at their own row', () => {
    const leads = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'Nameless', '', '', '', '']),
        dataRow(['t', 'B', '', '', '', 'b@b.com']),
      ],
    })

    expect(leads.map((lead) => lead.rowNumber)).toEqual([3])
  })

  it('should skip rows with no email, since they cannot be matched or contacted', () => {
    expect(parseLeads({ rows: [HEADER_ROW, dataRow(['t', 'Nameless', '', '', '', ''])] })).toEqual([])
  })

  it('should return an empty list when the sheet has only a header row', () => {
    expect(parseLeads({ rows: [HEADER_ROW] })).toEqual([])
  })

  it('should return an empty list when the sheet is completely empty', () => {
    expect(parseLeads({ rows: [] })).toEqual([])
  })

  it('should throw when the sheet has no email column at all, rather than silently returning nothing', () => {
    const rows = [['Timestamp', 'Name', 'Company'], dataRow(['t', 'Dana', 'Salted Mind'])]

    expect(() => parseLeads({ rows })).toThrow(/no email column/i)
  })
})
