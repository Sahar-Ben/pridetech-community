import { describe, expect, it, vi } from 'vitest'
import { loadLeadsReview } from './loadLeadsReview'
import { LEADS_RANGE, MEMBERS_RANGE } from './sheetTabs'
import { isExpiredSessionError, SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

const rejectingRead = (range: string) =>
  vi
    .fn()
    .mockImplementation(({ range: requested }: { range: string }) =>
      requested === range
        ? Promise.reject(
            new SheetsRequestError({ range, status: 403, detail: 'Caller lacks permission' }),
          )
        : Promise.resolve([]),
    )

describe('loadLeadsReview', () => {
  it('should read the Leads tab wide enough to reach the hand-added Status column', async () => {
    const readRange = vi.fn().mockResolvedValue([LEADS_HEADER_ROW])
    const sheetsClient = createFakeSheetsClient({ readRange })

    await loadLeadsReview({ sheetsClient })

    expect(readRange).toHaveBeenCalledWith({ range: LEADS_RANGE })
    expect(LEADS_RANGE).toMatch(/^Leads!/)
  })

  it('should read the Members tab, since a blank Status cannot tell who was already approved', async () => {
    const readRange = vi.fn().mockResolvedValue([MEMBERS_HEADER_ROW])
    const sheetsClient = createFakeSheetsClient({ readRange })

    await loadLeadsReview({ sheetsClient })

    expect(readRange).toHaveBeenCalledWith({ range: MEMBERS_RANGE })
    expect(MEMBERS_RANGE).toMatch(/^Members!/)
  })

  it('should set aside an application whose email is already on the Members tab', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
        leadRow({ name: 'Ariel Cohen', email: 'Ariel@Example.com' }),
      ],
      memberRows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Ariel Cohen', mail: 'ariel@example.com' })],
    })

    const review = await loadLeadsReview({ sheetsClient })

    expect(review.waitingApplications.map((waiting) => waiting.lead.name)).toEqual(['Noa Feldman'])
    expect(review.alreadyMemberLeads.map((excluded) => excluded.lead.name)).toEqual(['Ariel Cohen'])
    expect(review.alreadyMemberLeads[0]?.member.rowNumber).toBe(2)
  })

  it('should keep an application in the queue when the member it matches is an ex-member', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' })],
      memberRows: [
        MEMBERS_HEADER_ROW,
        memberRow({ name: 'Ariel Cohen', mail: 'ariel@example.com', status: 'Ex-member' }),
      ],
    })

    const review = await loadLeadsReview({ sheetsClient })

    expect(review.waitingApplications.map((waiting) => waiting.lead.name)).toEqual(['Ariel Cohen'])
    expect(review.waitingApplications[0]?.priorMember?.rowNumber).toBe(2)
  })

  it('should let a Leads failure through with its range and status intact', async () => {
    const sheetsClient = createFakeSheetsClient({ readRange: rejectingRead(LEADS_RANGE) })

    await expect(loadLeadsReview({ sheetsClient })).rejects.toThrow(
      /403.*Caller lacks permission/,
    )
  })

  it('should refuse the whole read when the Members tab cannot be read, rather than filter nothing', async () => {
    const sheetsClient = createFakeSheetsClient({ readRange: rejectingRead(MEMBERS_RANGE) })

    await expect(loadLeadsReview({ sheetsClient })).rejects.toThrow(/Members tab could not be read/i)
  })

  it('should keep Google own words when the Members read fails, so the cause is visible', async () => {
    const sheetsClient = createFakeSheetsClient({ readRange: rejectingRead(MEMBERS_RANGE) })

    await expect(loadLeadsReview({ sheetsClient })).rejects.toThrow(/Caller lacks permission/)
  })

  it('should still look like an expired session when the Members read is the one refused', async () => {
    const readRange = vi
      .fn()
      .mockImplementation(({ range }: { range: string }) =>
        range === MEMBERS_RANGE
          ? Promise.reject(
              new SheetsRequestError({ range, status: 401, detail: 'Invalid Credentials' }),
            )
          : Promise.resolve([LEADS_HEADER_ROW]),
      )

    const error = await loadLeadsReview({
      sheetsClient: createFakeSheetsClient({ readRange }),
    }).catch((caught: unknown) => caught)

    expect(isExpiredSessionError(error)).toBe(true)
  })

  it('should refuse to return an empty queue when the Leads tab has no email column', async () => {
    const sheetsClient = createFakeSheetsClient({ rows: [['Timestamp', 'Name'], ['t', 'Dana']] })

    await expect(loadLeadsReview({ sheetsClient })).rejects.toThrow(/Leads tab has no email column/i)
  })

  it('should refuse to return an unfiltered queue when the Members tab has no email column', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
      memberRows: [['Name', 'Company'], ['Ariel Cohen', 'Cloudinary']],
    })

    await expect(loadLeadsReview({ sheetsClient })).rejects.toThrow(
      /Members tab has no email column/i,
    )
  })
})
