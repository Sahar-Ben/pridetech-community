import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEventRegistrants } from './useEventRegistrants'
import type { AttachedResponseSheet } from './parseAttachedSheets'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  buildAttachedSheet,
  createFakeResponseSheetAccess,
} from '../../testing/eventsRegistryFactory'

const HEADER = ['Timestamp', 'Name', 'Email', 'Company']

const sheet = buildAttachedSheet({ eventId: 'evt-1' })

const accessReturning = (rows: readonly string[][]) =>
  createFakeResponseSheetAccess({
    readRows: vi.fn(async () => await Promise.resolve([HEADER, ...rows])),
  })

const renderRegistrants = ({
  access,
  attachedSheets = [sheet],
  onSessionExpired = vi.fn(),
}: {
  access: ResponseSheetAccess
  attachedSheets?: readonly AttachedResponseSheet[]
  onSessionExpired?: () => void
}) =>
  renderHook(
    (props: { attachedSheets: readonly AttachedResponseSheet[] }) =>
      useEventRegistrants({ access, attachedSheets: props.attachedSheets, onSessionExpired }),
    { initialProps: { attachedSheets } },
  )

const namesFor = (
  result: { current: ReturnType<typeof useEventRegistrants> },
  eventId: string,
): readonly string[] | undefined =>
  result.current.loads.get(eventId)?.read?.registrants.map((registrant) => registrant.name)

describe('useEventRegistrants', () => {
  it('should read nothing until an event is asked for', () => {
    const access = accessReturning([])

    const { result } = renderRegistrants({ access })

    expect(access.readRows).not.toHaveBeenCalled()
    expect(result.current.loads.size).toBe(0)
  })

  it("should read an event's sheets when it is asked for", async () => {
    const access = accessReturning([['', 'Dana Sorkin', 'dana@example.com', '']])
    const { result } = renderRegistrants({ access })

    act(() => result.current.request('evt-1'))

    expect(result.current.loads.get('evt-1')?.isReading).toBe(true)
    await waitFor(() => expect(namesFor(result, 'evt-1')).toEqual(['Dana Sorkin']))
    expect(result.current.loads.get('evt-1')?.isReading).toBe(false)
  })

  it('should not read an event again when it is asked for a second time', async () => {
    const access = accessReturning([])
    const { result } = renderRegistrants({ access })

    act(() => result.current.request('evt-1'))
    await waitFor(() => expect(result.current.loads.get('evt-1')?.isReading).toBe(false))
    act(() => result.current.request('evt-1'))

    expect(access.readRows).toHaveBeenCalledTimes(1)
  })

  it('should read again on reload, keeping the last list on screen meanwhile', async () => {
    const readRows = vi
      .fn()
      .mockResolvedValueOnce([HEADER, ['', 'Dana Sorkin', 'dana@example.com', '']])
      .mockResolvedValueOnce([
        HEADER,
        ['', 'Dana Sorkin', 'dana@example.com', ''],
        ['', 'Noa Feldman', 'noa@example.com', ''],
      ])
    const { result } = renderRegistrants({ access: createFakeResponseSheetAccess({ readRows }) })
    act(() => result.current.request('evt-1'))
    await waitFor(() => expect(namesFor(result, 'evt-1')).toEqual(['Dana Sorkin']))

    act(() => result.current.reload('evt-1'))

    expect(namesFor(result, 'evt-1')).toEqual(['Dana Sorkin'])
    await waitFor(() => expect(namesFor(result, 'evt-1')).toEqual(['Dana Sorkin', 'Noa Feldman']))
  })

  it('should answer an event with no attached sheet with an empty list, without reading', () => {
    const access = accessReturning([])
    const { result } = renderRegistrants({ access, attachedSheets: [] })

    act(() => result.current.request('evt-1'))

    expect(access.readRows).not.toHaveBeenCalled()
    expect(namesFor(result, 'evt-1')).toEqual([])
  })

  it('should read an opened event again once a sheet is attached to it', async () => {
    const access = accessReturning([['', 'Dana Sorkin', 'dana@example.com', '']])
    const { result, rerender } = renderRegistrants({ access, attachedSheets: [] })
    act(() => result.current.request('evt-1'))
    expect(namesFor(result, 'evt-1')).toEqual([])

    rerender({ attachedSheets: [sheet] })

    await waitFor(() => expect(namesFor(result, 'evt-1')).toEqual(['Dana Sorkin']))
  })

  it('should not read an event nobody opened when a sheet is attached to it', () => {
    const access = accessReturning([])
    const { rerender } = renderRegistrants({ access, attachedSheets: [] })

    rerender({ attachedSheets: [sheet] })

    expect(access.readRows).not.toHaveBeenCalled()
  })

  it('should sign the organiser back in when the session has expired', async () => {
    const onSessionExpired = vi.fn()
    const access = createFakeResponseSheetAccess({
      readRows: vi.fn(async () => {
        throw new SheetsRequestError({ range: 'A1:Z', status: 401, detail: 'expired' })
      }),
    })
    const { result } = renderRegistrants({ access, onSessionExpired })

    act(() => result.current.request('evt-1'))

    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1))
  })
})
