import { describe, expect, it } from 'vitest'
import { groupDuplicateApplicants } from './duplicateApplicants'
import { markLeadsDuplicate } from './markLeadsDuplicate'
import { parseLeads } from './parseLeads'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { LEADS_HEADER_ROW, leadRow } from '../../testing/sheetsClientFactory'

const FIRST = leadRow({ name: 'Dana Maman', email: 'dana@example.com', timestamp: '3/8/2025 14:25:20' })
const SECOND = leadRow({ name: 'Dana Maman', email: 'dana@example.com', timestamp: '4/1/2025 09:00:00' })
const THIRD = leadRow({ name: 'Dana Maman', email: 'dana@example.com', timestamp: '5/2/2025 11:30:00' })

const STATUS_COLUMN = LEADS_HEADER_ROW.indexOf('Status')

const sheetWith = (rows: readonly (readonly string[])[]): FakeSheet =>
  createFakeSheet({ tabs: { Leads: [LEADS_HEADER_ROW, ...rows] } })

/* The group as the screen would hold it: read from the sheet as it was. */
const readDuplicate = (rows: readonly (readonly string[])[]) => {
  const [duplicate] = groupDuplicateApplicants({
    leads: parseLeads({ rows: [LEADS_HEADER_ROW, ...rows] }).leads,
  })
  if (duplicate === undefined) {
    throw new Error('expected one duplicate group')
  }
  return duplicate
}

const statuses = (sheet: FakeSheet) =>
  sheet.rowsOf('Leads').slice(1).map((row) => row[STATUS_COLUMN])

describe('markLeadsDuplicate', () => {
  it('should mark every later application Duplicate and leave the kept one alone', async () => {
    const rows = [FIRST, SECOND, THIRD]
    const sheet = sheetWith(rows)

    await markLeadsDuplicate({ sheetsClient: sheet.client, duplicate: readDuplicate(rows), keptRowNumber: 2 })

    expect(statuses(sheet)).toEqual(['', 'Duplicate', 'Duplicate'])
  })

  it('should send the status as typed', async () => {
    const rows = [FIRST, SECOND]
    const sheet = sheetWith(rows)

    await markLeadsDuplicate({ sheetsClient: sheet.client, duplicate: readDuplicate(rows), keptRowNumber: 2 })

    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW'])
  })

  it('should write nothing when a row moved before the first write', async () => {
    const rows = [FIRST, SECOND]
    const duplicate = readDuplicate(rows)
    const sheet = sheetWith([leadRow({ name: 'Noa Levi', email: 'noa@example.com' }), FIRST, SECOND])

    await expect(markLeadsDuplicate({ sheetsClient: sheet.client, duplicate, keptRowNumber: 2 })).rejects.toThrow()
    expect(sheet.writes).toEqual([])
  })

  it('should say how many were marked when it is refused part of the way through', async () => {
    const rows = [FIRST, SECOND, THIRD]
    const duplicate = readDuplicate(rows)
    const sheet = sheetWith([FIRST, SECOND, leadRow({ name: 'Noa Levi', email: 'noa@example.com' })])

    await expect(markLeadsDuplicate({ sheetsClient: sheet.client, duplicate, keptRowNumber: 2 })).rejects.toThrow(
      /1 of 2 rows were marked Duplicate/,
    )
  })
})

describe('markLeadsDuplicate, keeping the row the reviewer chose', () => {
  it('should mark every other row, including earlier ones, and leave the chosen row alone', async () => {
    const rows = [FIRST, SECOND, THIRD]
    const sheet = sheetWith(rows)

    await markLeadsDuplicate({
      sheetsClient: sheet.client,
      duplicate: readDuplicate(rows),
      keptRowNumber: 4,
    })

    expect(statuses(sheet)).toEqual(['Duplicate', 'Duplicate', ''])
  })

  it('should refuse a row that is not one of these applications, and write nothing', async () => {
    const rows = [FIRST, SECOND]
    const sheet = sheetWith(rows)

    await expect(
      markLeadsDuplicate({ sheetsClient: sheet.client, duplicate: readDuplicate(rows), keptRowNumber: 40 }),
    ).rejects.toThrow(/nothing was written/)
    expect(sheet.writes).toEqual([])
  })
})

describe('parseLeads, a row marked Duplicate', () => {
  it('should read Duplicate however it was typed', () => {
    const { leads } = parseLeads({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Dana', email: 'd@example.com', status: ' duplicate ' })],
    })

    expect(leads[0]?.status).toBe('duplicate')
  })
})
