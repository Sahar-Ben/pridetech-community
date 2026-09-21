import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLeads } from './useLeads'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
} from '../../testing/sheetsClientFactory'

const sheetWith = (rows: readonly string[][]) => createFakeSheetsClient({ rows })

describe('useLeads', () => {
  it('should start out loading', () => {
    const sheetsClient = sheetWith([LEADS_HEADER_ROW])
    const { result } = renderHook(() => useLeads({ sheetsClient, onSessionExpired: vi.fn() }))

    expect(result.current.state.status).toBe('loading')
  })

  it('should expose the leads read from the sheet', async () => {
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
      leads: [expect.objectContaining({ name: 'Noa Feldman' })],
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
    const sheetsClient = sheetWith([['Timestamp', 'Name']])
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

  it('should read the sheet again when asked to reload', async () => {
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
      expect(readRange).toHaveBeenCalledTimes(2)
    })
  })
})
