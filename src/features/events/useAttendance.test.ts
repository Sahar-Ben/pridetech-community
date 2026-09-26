import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AttendanceEntry } from './attendanceLog'
import type { AttendanceStore } from './attendanceStore'
import { useAttendance } from './useAttendance'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const checkIn = (overrides: Partial<AttendanceEntry> = {}): AttendanceEntry => ({
  eventId: 'evt-1',
  email: 'dana@example.com',
  name: 'Dana Sorkin',
  status: 'attended',
  at: '2026-10-14T18:00:00.000Z',
  ...overrides,
})

/* A store over an in-memory log, with a gate on each append so a test can
   hold a write in flight. */
const createGatedStore = () => {
  const log: AttendanceEntry[] = []
  const gates: (() => void)[] = []
  const store: AttendanceStore = {
    readEntries: vi.fn(async () => await Promise.resolve([...log])),
    appendEntry: vi.fn(
      async (entry: AttendanceEntry) =>
        await new Promise<void>((resolve) => {
          gates.push(() => {
            log.push(entry)
            resolve()
          })
        }),
    ),
  }
  const releaseNext = async () => {
    await act(async () => {
      gates.shift()?.()
      await Promise.resolve()
    })
  }
  return { store, log, releaseNext }
}

const renderAttendance = (store: AttendanceStore, onSessionExpired = vi.fn()) =>
  renderHook(() => useAttendance({ store, onSessionExpired }))

describe('useAttendance', () => {
  it('should read the Attendance tab once, when first asked', async () => {
    const { store } = createGatedStore()
    const { result } = renderAttendance(store)

    act(() => result.current.request())
    act(() => result.current.request())

    await waitFor(() => expect(result.current.hasRead).toBe(true))
    expect(store.readEntries).toHaveBeenCalledTimes(1)
  })

  it('should show a tap at once, before the sheet has it', () => {
    const { store } = createGatedStore()
    const { result } = renderAttendance(store)

    act(() => result.current.record(checkIn()))

    expect(result.current.entries).toEqual([checkIn()])
    expect(result.current.savingCount).toBe(1)
  })

  it('should write taps one at a time, in the order they were made', async () => {
    const { store, log, releaseNext } = createGatedStore()
    const { result } = renderAttendance(store)

    act(() => {
      result.current.record(checkIn())
      result.current.record(checkIn({ status: 'undone', at: '2026-10-14T18:00:05.000Z' }))
    })
    await waitFor(() => expect(store.appendEntry).toHaveBeenCalledTimes(1))
    await releaseNext()
    await waitFor(() => expect(store.appendEntry).toHaveBeenCalledTimes(2))
    await releaseNext()

    expect(log.map((entry) => entry.status)).toEqual(['attended', 'undone'])
    await waitFor(() => expect(result.current.savingCount).toBe(0))
  })

  it('should not show a saved tap twice once a read brings it back', async () => {
    const { store, releaseNext } = createGatedStore()
    const { result } = renderAttendance(store)
    act(() => result.current.record(checkIn()))
    await waitFor(() => expect(store.appendEntry).toHaveBeenCalled())
    await releaseNext()

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.hasRead).toBe(true))
    expect(result.current.entries).toEqual([checkIn()])
  })

  it('should keep a tap on screen when a read comes back without it', async () => {
    const { store } = createGatedStore()
    const { result } = renderAttendance(store)
    act(() => result.current.record(checkIn()))

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.hasRead).toBe(true))
    expect(result.current.entries).toEqual([checkIn()])
  })

  it('should take a tap back and say so when the sheet refuses it', async () => {
    const store: AttendanceStore = {
      readEntries: vi.fn(async () => await Promise.resolve([])),
      appendEntry: vi.fn(async () => {
        throw new Error('Quota exceeded')
      }),
    }
    const { result } = renderAttendance(store)

    act(() => result.current.record(checkIn()))

    await waitFor(() => expect(result.current.saveError).toMatch(/dana sorkin was not saved/i))
    expect(result.current.entries).toEqual([])
  })

  it('should sign the organiser back in when a write finds the session expired', async () => {
    const onSessionExpired = vi.fn()
    const store: AttendanceStore = {
      readEntries: vi.fn(async () => await Promise.resolve([])),
      appendEntry: vi.fn(async () => {
        throw new SheetsRequestError({ range: 'Attendance!A:Z', status: 401, detail: 'expired' })
      }),
    }
    const { result } = renderAttendance(store, onSessionExpired)

    act(() => result.current.record(checkIn()))

    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1))
  })

  it('should say when the Attendance tab could not be read', async () => {
    const store: AttendanceStore = {
      readEntries: vi.fn(async () => {
        throw new Error('The Attendance tab could not be read. Quota exceeded')
      }),
      appendEntry: vi.fn(),
    }
    const { result } = renderAttendance(store)

    act(() => result.current.request())

    await waitFor(() => expect(result.current.readError).toMatch(/quota exceeded/i))
  })
})
