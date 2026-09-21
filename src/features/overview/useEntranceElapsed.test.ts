import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEntranceElapsed } from './useEntranceElapsed'

type Frame = (now: number) => void

const takeOverAnimationFrames = () => {
  const frames = new Map<number, Frame>()
  let nextHandle = 1
  vi.stubGlobal('requestAnimationFrame', (callback: Frame) => {
    const handle = nextHandle
    nextHandle += 1
    frames.set(handle, callback)
    return handle
  })
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    frames.delete(handle)
  })
  return {
    advanceTo: (now: number) => {
      const pending = [...frames.entries()]
      frames.clear()
      act(() => {
        pending.forEach(([, frame]) => frame(now))
      })
    },
    pendingFrameCount: () => frames.size,
  }
}

const stubMotionPreference = (prefersReducedMotion: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches: prefersReducedMotion }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useEntranceElapsed', () => {
  it('should start at the beginning of the entrance', () => {
    stubMotionPreference(false)
    takeOverAnimationFrames()

    const { result } = renderHook(() => useEntranceElapsed(800))

    expect(result.current).toBe(0)
  })

  it('should advance with the clock', () => {
    stubMotionPreference(false)
    const frames = takeOverAnimationFrames()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result } = renderHook(() => useEntranceElapsed(800))

    frames.advanceTo(1300)

    expect(result.current).toBe(300)
  })

  it('should stop at the end of the entrance rather than running on', () => {
    stubMotionPreference(false)
    const frames = takeOverAnimationFrames()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result } = renderHook(() => useEntranceElapsed(800))

    frames.advanceTo(5000)

    expect(result.current).toBe(800)
    expect(frames.pendingFrameCount()).toBe(0)
  })

  it('should not restart when something else re-renders the chart mid-animation', () => {
    stubMotionPreference(false)
    const frames = takeOverAnimationFrames()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const { result, rerender } = renderHook(() => useEntranceElapsed(800))
    frames.advanceTo(1300)

    rerender()

    expect(result.current).toBe(300)
    frames.advanceTo(1500)
    expect(result.current).toBe(500)
  })

  it('should hand a viewer who asked for less motion the finished state, not a quicker one', () => {
    stubMotionPreference(true)
    const frames = takeOverAnimationFrames()

    const { result } = renderHook(() => useEntranceElapsed(800))

    expect(result.current).toBe(800)
    expect(frames.pendingFrameCount()).toBe(0)
  })
})
