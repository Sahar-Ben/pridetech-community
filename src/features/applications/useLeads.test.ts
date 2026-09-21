import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { useLeads } from './useLeads'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
  MEMBERS_HEADER_ROW,
  memberRow,
} from '../../testing/sheetsClientFactory'

const sheetWith = (rows: readonly string[][]) => createFakeSheetsClient({ rows })

const rangesRead = (readRange: Mock): string[] =>
  readRange.mock.calls.map(([options]) => String((options as { range: string }).range))

describe('useLeads', () => {
  it('should start out loading', () => {
    const sheetsClient = sheetWith([LEADS_HEADER_ROW])
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    expect(result.current.state.status).toBe('loading')
  })

  it('should expose the applications waiting for review', async () => {
    const sheetsClient = sheetWith([
      LEADS_HEADER_ROW,
      leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
    ])
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    expect(result.current.state).toEqual({
      status: 'ready',
      review: expect.objectContaining({
        waitingApplications: [
          expect.objectContaining({ lead: expect.objectContaining({ name: 'Noa Feldman' }) }),
        ],
      }),
    })
  })

  it('should set aside an application whose email is already on the Members tab', async () => {
    const sheetsClient = createFakeSheetsClient({
      rows: [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })],
      memberRows: [MEMBERS_HEADER_ROW, memberRow({ name: 'Noa Feldman', mail: 'noa@example.com' })],
    })
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    expect(result.current.state).toEqual({
      status: 'ready',
      review: expect.objectContaining({
        waitingApplications: [],
        alreadyMemberLeads: [
          expect.objectContaining({ member: expect.objectContaining({ rowNumber: 2 }) }),
        ],
      }),
    })
  })

  it('should report a failed Members read instead of an unfiltered queue', async () => {
    const readRange = vi.fn().mockImplementation(({ range }: { range: string }) =>
      range.startsWith('Members')
        ? Promise.reject(
            new SheetsRequestError({ range, status: 403, detail: 'Caller lacks permission' }),
          )
        : Promise.resolve([
            LEADS_HEADER_ROW,
            leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
          ]),
    )
    const sheetsClient = createFakeSheetsClient({ readRange })
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'failed',
        message: expect.stringMatching(/Members tab could not be read/i),
      })
    })
  })

  it('should report a failed read with the message the sheets client produced', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({
          range: 'Leads!A1:Z',
          status: 403,
          detail: 'The caller does not have permission',
        }),
      )
    const sheetsClient = createFakeSheetsClient({ readRange })
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state.status).toBe('failed')
    })
    expect(result.current.state).toEqual({
      status: 'failed',
      message: expect.stringContaining('The caller does not have permission'),
    })
  })

  it('should report a Leads tab with no email column instead of an empty queue', async () => {
    const sheetsClient = createFakeSheetsClient({ rows: [['Timestamp', 'Name']] })
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'failed',
        message: expect.stringMatching(/no email column/i),
      })
    })
  })

  it('should tell the app the session expired when the token is no longer accepted', async () => {
    const onSessionExpired = vi.fn()
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 401, detail: 'Invalid Credentials' }),
      )
    const sheetsClient = createFakeSheetsClient({ readRange })
    renderHook(() => useLeads({ sheetsClient, onSessionExpired }))

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
  })

  it('should read both tabs again when asked to reload', async () => {
    const readRange = vi.fn().mockResolvedValue([LEADS_HEADER_ROW])
    const sheetsClient = createFakeSheetsClient({ readRange })
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })
    act(() => {
      result.current.reload()
    })

    await waitFor(() => {
      expect(rangesRead(readRange)).toEqual([
        'Leads!A1:Z',
        'Members!A1:Z',
        'Leads!A1:Z',
        'Members!A1:Z',
      ])
    })
  })
})
