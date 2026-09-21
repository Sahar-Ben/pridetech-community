import { describe, expect, it, vi } from 'vitest'
import { LEADS_RANGE, loadLeads } from './loadLeads'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
} from '../../testing/sheetsClientFactory'

describe('loadLeads', () => {
  it('should read the Leads tab wide enough to reach the hand-added Status column', async () => {
    const readRange = vi.fn().mockResolvedValue([LEADS_HEADER_ROW])
    const sheetsClient = createFakeSheetsClient({ readRange })

    await loadLeads({ sheetsClient })

    expect(readRange).toHaveBeenCalledWith({ range: LEADS_RANGE })
    expect(LEADS_RANGE).toMatch(/^Leads!/)
  })

  it('should return the parsed leads from the sheet', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com', status: 'Approved' }),
      ],
    })

    const leads = await loadLeads({ sheetsClient })

    expect(leads.map((lead) => lead.status)).toEqual(['pending', 'approved'])
    expect(leads.map((lead) => lead.rowNumber)).toEqual([2, 3])
  })

  it('should let a sheet failure through with its range and status intact', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: LEADS_RANGE, status: 403, detail: 'Caller lacks permission' }),
      )

    await expect(loadLeads({ sheetsClient: createFakeSheetsClient({ readRange }) })).rejects.toThrow(
      /403.*Caller lacks permission/,
    )
  })

  it('should refuse to return an empty queue when the tab has no email column', async () => {
    const sheetsClient = createFakeSheetsClient({ rows: [['Timestamp', 'Name'], ['t', 'Dana']] })

    await expect(loadLeads({ sheetsClient })).rejects.toThrow(/no email column/i)
  })
})
