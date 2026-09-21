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
  it('should carry the submission stamp, which is what tells one application from another', () => {
    const { leads } = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['3/8/2025 14:25:20', 'Dana Maman', '', '', '', 'dana@example.com']),
      ],
    })

    expect(leads[0]?.timestamp).toBe('3/8/2025 14:25:20')
  })

  it('should report no submission stamp rather than invent one when the column is absent', () => {
    const { leads } = parseLeads({ rows: [['Name', 'E-Mail'], ['Dana', 'dana@example.com']] })

    expect(leads[0]?.timestamp).toBeUndefined()
  })

  it('should parse a complete row into a lead', () => {
    const { leads } = parseLeads({
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
    const [lead] = leads

    expect(lead).toEqual({
      rowNumber: 2,
      timestamp: '3/8/2025 14:25:20',
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
    const { leads } = parseLeads({
      rows: [HEADER_ROW, dataRow(['t', 'A', 'B', 'C', 'D', 'MiXeD@Example.COM', '', '', '', '', ''])],
    })
    const [lead] = leads

    expect(lead?.email).toBe('mixed@example.com')
  })

  it('should treat an empty Status cell as pending', () => {
    const [lead] = parseLeads({ rows: [HEADER_ROW, dataRow(['t', 'A', '', '', '', 'a@b.com'])] }).leads

    expect(lead?.status).toBe('pending')
  })

  it('should read Approved and Declined statuses', () => {
    const { leads } = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'A', '', '', '', 'a@b.com', '', '', '', '', 'Approved']),
        dataRow(['t', 'B', '', '', '', 'b@b.com', '', '', '', '', 'Declined']),
      ],
    })

    expect(leads.map((lead) => lead.status)).toEqual(['approved', 'declined'])
  })

  it('should count a status nobody recognises as pending, so the applicant stays visible', () => {
    const { leads } = parseLeads({
      rows: [HEADER_ROW, dataRow(['t', 'A', '', '', '', 'a@b.com', '', '', '', '', 'Decline'])],
    })

    expect(leads.map((lead) => lead.status)).toEqual(['pending'])
  })

  it('should give each lead its 1-based sheet row number so writes target the right row', () => {
    const { leads } = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'A', '', '', '', 'a@b.com']),
        dataRow(['t', 'B', '', '', '', 'b@b.com']),
      ],
    })

    expect(leads.map((lead) => lead.rowNumber)).toEqual([2, 3])
  })

  it('should keep the row number of a skipped row, so later rows still point at their own row', () => {
    const { leads } = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'Nameless', '', '', '', '']),
        dataRow(['t', 'B', '', '', '', 'b@b.com']),
      ],
    })

    expect(leads.map((lead) => lead.rowNumber)).toEqual([3])
  })

  it('should skip rows with no email, since they cannot be matched or contacted', () => {
    expect(parseLeads({ rows: [HEADER_ROW, dataRow(['t', 'Nameless', '', '', '', ''])] }).leads).toEqual(
      [],
    )
  })

  it('should return an empty list when the sheet has only a header row', () => {
    expect(parseLeads({ rows: [HEADER_ROW] }).leads).toEqual([])
  })

  it('should return an empty list when the sheet is completely empty', () => {
    expect(parseLeads({ rows: [] }).leads).toEqual([])
  })

  it('should report the rows it dropped for having no email, so they can be found in the sheet', () => {
    const parsed = parseLeads({
      rows: [
        HEADER_ROW,
        dataRow(['t', 'Nameless', '', '', '', '']),
        dataRow(['t', 'B', '', '', '', 'b@b.com']),
        dataRow(['t', 'Also nameless', '', '', '', '\u{200b}']),
      ],
    })

    expect(parsed.rowsWithoutEmail).toEqual([
      { rowNumber: 2, name: 'Nameless' },
      { rowNumber: 4, name: 'Also nameless' },
    ])
  })

  it('should not report a blank spacer row as an application that forgot its email', () => {
    const parsed = parseLeads({ rows: [HEADER_ROW, dataRow([]), dataRow(['', '', '', '', '', ''])] })

    expect(parsed.rowsWithoutEmail).toEqual([])
  })

  it('should throw when the sheet has no email column at all, rather than silently returning nothing', () => {
    const rows = [['Timestamp', 'Name', 'Company'], dataRow(['t', 'Dana', 'Salted Mind'])]

    expect(() => parseLeads({ rows })).toThrow(/no email column/i)
  })
})
