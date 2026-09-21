import { describe, expect, it, vi } from 'vitest'
import { loadOverview } from './loadOverview'
import { createFakeSheet } from '../../testing/fakeSheet'
import {
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const asOf = new Date(2026, 8, 21)

const sheetWith = ({
  members = [] as readonly string[][],
  leads = [] as readonly string[][],
} = {}) =>
  createFakeSheet({
    tabs: {
      Members: [MEMBERS_HEADER_ROW, ...members],
      Leads: [LEADS_HEADER_ROW, ...leads],
    },
  })

describe('loadOverview', () => {
  it('should describe the community from both tabs', async () => {
    const sheet = sheetWith({
      members: [memberRow({ name: 'Dana Sorkin', mail: 'dana@example.com', gender: 'F' })],
      leads: [leadRow({ name: 'Dana Sorkin', email: 'dana@example.com', timestamp: '3/8/2022' })],
    })

    const overview = await loadOverview({ sheetsClient: sheet.client, asOf })

    expect(overview.memberCount).toBe(1)
    expect(overview.tenure.buckets.find((bucket) => bucket.key === 'four-years-or-more')?.count).toBe(1)
  })

  it('should name the tab that could not be read rather than drawing empty charts', async () => {
    const sheetsClient: SheetsClient = {
      ...sheetWith().client,
      readRange: vi
        .fn()
        .mockRejectedValue(
          new SheetsRequestError({ range: 'Leads!A1:Z', status: 500, detail: 'boom' }),
        ),
    }

    await expect(loadOverview({ sheetsClient, asOf })).rejects.toThrow(/tab could not be read/)
  })
})
