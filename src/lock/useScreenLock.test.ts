import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RELOCK_AFTER_MS, useScreenLock } from './useScreenLock'
import { createFakeDeviceLock } from '../testing/deviceLockFactory'

const CREDENTIAL_KEY = 'pridetech.lockCredentialId'

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
  document.dispatchEvent(new Event('visibilitychange'))
}

/* Face ID left open: the sheet is up and nobody has looked at it yet. */
const neverAnswered = () => new Promise<void>(() => undefined)

const createClock = () => {
  let time = 1_000_000
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms
    },
  }
}

afterEach(() => {
  window.localStorage.clear()
  setVisibility('visible')
})

describe('useScreenLock', () => {
  it('should leave the app open when no lock was ever set up', () => {
    const { result } = renderHook(() => useScreenLock({ deviceLock: createFakeDeviceLock() }))

    expect(result.current.isOn).toBe(false)
    expect(result.current.isLocked).toBe(false)
  })

  it('should say whether the device can lock at all', async () => {
    const { result } = renderHook(() =>
      useScreenLock({ deviceLock: createFakeDeviceLock({ available: true }) }),
    )

    await waitFor(() => expect(result.current.isAvailable).toBe(true))
  })

  it('should start locked when a lock was set up in an earlier session', () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const deviceLock = createFakeDeviceLock()
    deviceLock.verify.mockImplementation(neverAnswered)

    const { result } = renderHook(() => useScreenLock({ deviceLock }))

    expect(result.current.isLocked).toBe(true)
  })

  it('should open Face ID by itself when the app starts locked', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const deviceLock = createFakeDeviceLock()

    const { result } = renderHook(() => useScreenLock({ deviceLock }))

    await waitFor(() => expect(result.current.isLocked).toBe(false))
    expect(deviceLock.verify).toHaveBeenCalledTimes(1)
    expect(deviceLock.verify).toHaveBeenCalledWith('passkey-1')
  })

  it('should stay locked without a message when Face ID does not open by itself', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const deviceLock = createFakeDeviceLock()
    deviceLock.verify.mockRejectedValueOnce(new Error('Face ID was cancelled.'))

    const { result } = renderHook(() => useScreenLock({ deviceLock }))

    await waitFor(() => expect(deviceLock.verify).toHaveBeenCalledTimes(1))
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.isLocked).toBe(true)
    expect(result.current.message).toBeUndefined()
    expect(result.current.isBusy).toBe(false)
  })

  it('should wait until the app is on screen before opening Face ID', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    setVisibility('hidden')
    const deviceLock = createFakeDeviceLock()
    const { result } = renderHook(() => useScreenLock({ deviceLock }))

    expect(deviceLock.verify).not.toHaveBeenCalled()

    act(() => setVisibility('visible'))

    await waitFor(() => expect(result.current.isLocked).toBe(false))
    expect(deviceLock.verify).toHaveBeenCalledTimes(1)
  })

  it('should unlock with the passkey it was set up with when the button is tapped', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const deviceLock = createFakeDeviceLock()
    deviceLock.verify.mockRejectedValueOnce(new Error('Face ID was cancelled.'))
    const { result } = renderHook(() => useScreenLock({ deviceLock }))
    await waitFor(() => expect(deviceLock.verify).toHaveBeenCalledTimes(1))

    act(() => result.current.unlock())

    await waitFor(() => expect(result.current.isLocked).toBe(false))
    expect(deviceLock.verify).toHaveBeenCalledTimes(2)
    expect(deviceLock.verify).toHaveBeenLastCalledWith('passkey-1')
  })

  it('should stay locked and say why when Face ID is cancelled after a tap', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const deviceLock = createFakeDeviceLock()
    deviceLock.verify
      .mockRejectedValueOnce(new Error('Not without a tap.'))
      .mockRejectedValueOnce(new Error('Face ID was cancelled.'))
    const { result } = renderHook(() => useScreenLock({ deviceLock }))
    await waitFor(() => expect(deviceLock.verify).toHaveBeenCalledTimes(1))

    act(() => result.current.unlock())

    await waitFor(() => expect(result.current.message).toBe('Face ID was cancelled.'))
    expect(result.current.isLocked).toBe(true)
    expect(result.current.isBusy).toBe(false)
  })

  it('should remember a lock once turned on, without locking the screen in use', async () => {
    const { result } = renderHook(() => useScreenLock({ deviceLock: createFakeDeviceLock() }))

    act(() => result.current.turnOn())

    await waitFor(() => expect(result.current.isOn).toBe(true))
    expect(result.current.isLocked).toBe(false)
    expect(window.localStorage.getItem(CREDENTIAL_KEY)).toBe('passkey-1')
  })

  it('should stay off and say why when setting up is cancelled', async () => {
    const deviceLock = createFakeDeviceLock()
    deviceLock.enrol.mockRejectedValueOnce(new Error('Face ID was cancelled.'))
    const { result } = renderHook(() => useScreenLock({ deviceLock }))

    act(() => result.current.turnOn())

    await waitFor(() => expect(result.current.message).toBe('Face ID was cancelled.'))
    expect(result.current.isOn).toBe(false)
  })

  it('should forget the lock when turned off', () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const { result } = renderHook(() => useScreenLock({ deviceLock: createFakeDeviceLock() }))

    act(() => result.current.turnOff())

    expect(result.current.isOn).toBe(false)
    expect(result.current.isLocked).toBe(false)
    expect(window.localStorage.getItem(CREDENTIAL_KEY)).toBeNull()
  })

  it('should lock again after the app has been away for five minutes', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const clock = createClock()
    const deviceLock = createFakeDeviceLock()
    const { result } = renderHook(() => useScreenLock({ deviceLock, now: clock.now }))
    await waitFor(() => expect(result.current.isLocked).toBe(false))
    deviceLock.verify.mockImplementation(neverAnswered)

    act(() => setVisibility('hidden'))
    clock.advance(RELOCK_AFTER_MS)
    act(() => setVisibility('visible'))

    expect(result.current.isLocked).toBe(true)
  })

  it('should open Face ID by itself again when the app locks on return', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const clock = createClock()
    const deviceLock = createFakeDeviceLock()
    const { result } = renderHook(() => useScreenLock({ deviceLock, now: clock.now }))
    await waitFor(() => expect(result.current.isLocked).toBe(false))

    act(() => setVisibility('hidden'))
    clock.advance(RELOCK_AFTER_MS)
    act(() => setVisibility('visible'))

    await waitFor(() => expect(result.current.isLocked).toBe(false))
    expect(deviceLock.verify).toHaveBeenCalledTimes(2)
  })

  it('should not lock again after a shorter absence', async () => {
    window.localStorage.setItem(CREDENTIAL_KEY, 'passkey-1')
    const clock = createClock()
    const deviceLock = createFakeDeviceLock()
    const { result } = renderHook(() => useScreenLock({ deviceLock, now: clock.now }))
    await waitFor(() => expect(result.current.isLocked).toBe(false))

    act(() => setVisibility('hidden'))
    clock.advance(RELOCK_AFTER_MS - 1)
    act(() => setVisibility('visible'))

    expect(result.current.isLocked).toBe(false)
    expect(deviceLock.verify).toHaveBeenCalledTimes(1)
  })

  it('should not lock on return when the lock is off', () => {
    const clock = createClock()
    const { result } = renderHook(() =>
      useScreenLock({ deviceLock: createFakeDeviceLock(), now: clock.now }),
    )

    act(() => setVisibility('hidden'))
    clock.advance(RELOCK_AFTER_MS * 2)
    act(() => setVisibility('visible'))

    expect(result.current.isLocked).toBe(false)
  })
})
