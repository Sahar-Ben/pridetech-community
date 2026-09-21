import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PickSpreadsheet } from './spreadsheetPicker'
import { useSpreadsheetPicker } from './useSpreadsheetPicker'

describe('useSpreadsheetPicker', () => {
  it('should open the picker with the access token', () => {
    const pickSpreadsheet = vi.fn<PickSpreadsheet>()
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })

    expect(pickSpreadsheet).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'token-1' }),
    )
  })

  it('should hand the chosen spreadsheet id on', () => {
    const onPicked = vi.fn()
    const pickSpreadsheet: PickSpreadsheet = ({ onPicked: picked }) => {
      picked('spreadsheet-1')
    }
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked }),
    )

    act(() => {
      result.current.choose()
    })

    expect(onPicked).toHaveBeenCalledWith('spreadsheet-1')
    expect(result.current.message).toBeUndefined()
  })

  it('should say that nothing was chosen when the picker is cancelled', () => {
    const pickSpreadsheet: PickSpreadsheet = ({ onCancelled }) => {
      onCancelled()
    }
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })

    expect(result.current.message).toMatch(/no spreadsheet was chosen/i)
  })

  it('should surface a picker failure instead of failing silently', () => {
    const pickSpreadsheet: PickSpreadsheet = ({ onError }) => {
      onError('Google Picker has not loaded yet.')
    }
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })

    expect(result.current.message).toBe('Google Picker has not loaded yet.')
  })

  it('should surface a thrown picker failure rather than crashing the page', () => {
    const pickSpreadsheet: PickSpreadsheet = () => {
      throw new Error('picker exploded')
    }
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })

    expect(result.current.message).toBe('picker exploded')
  })

  it('should not open the picker while signed out, since it needs an access token', () => {
    const pickSpreadsheet = vi.fn<PickSpreadsheet>()
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: undefined, onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })

    expect(pickSpreadsheet).not.toHaveBeenCalled()
  })

  it('should clear an earlier message when the picker is opened again', () => {
    const pickSpreadsheet = vi
      .fn<PickSpreadsheet>()
      .mockImplementationOnce(({ onCancelled }) => {
        onCancelled()
      })
      .mockImplementationOnce(() => {})
    const { result } = renderHook(() =>
      useSpreadsheetPicker({ pickSpreadsheet, accessToken: 'token-1', onPicked: vi.fn() }),
    )

    act(() => {
      result.current.choose()
    })
    act(() => {
      result.current.choose()
    })

    expect(result.current.message).toBeUndefined()
  })
})
