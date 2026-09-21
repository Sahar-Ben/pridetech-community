import { describe, expect, it } from 'vitest'
import { toAnimatedCount, toBrandEase, toMarkProgress, toEntranceDurationMs } from './entrance'

describe('toBrandEase', () => {
  it('should start at nothing and finish at everything', () => {
    expect(toBrandEase(0)).toBeCloseTo(0)
    expect(toBrandEase(1)).toBeCloseTo(1)
  })

  it('should decelerate rather than run at a constant rate', () => {
    expect(toBrandEase(0.25)).toBeGreaterThan(0.25)
    expect(toBrandEase(0.75)).toBeGreaterThan(0.75)
  })

  it('should never go backwards', () => {
    const samples = [...Array(21).keys()].map((step) => toBrandEase(step / 20))

    samples.forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(samples[index - 1] ?? 0)
    })
  })

  it('should hold a progress outside the animation inside its own bounds', () => {
    expect(toBrandEase(-1)).toBe(0)
    expect(toBrandEase(2)).toBe(1)
  })
})

describe('toMarkProgress', () => {
  it('should hold a mark at nothing until its own turn comes round', () => {
    expect(toMarkProgress({ elapsedMs: 20, index: 3, durationMs: 700, staggerMs: 40 })).toBe(0)
  })

  it('should start a later mark later than an earlier one', () => {
    const first = toMarkProgress({ elapsedMs: 200, index: 0, durationMs: 700, staggerMs: 40 })
    const fourth = toMarkProgress({ elapsedMs: 200, index: 3, durationMs: 700, staggerMs: 40 })

    expect(first).toBeGreaterThan(fourth)
  })

  it('should finish every mark once the whole timeline has run', () => {
    expect(
      toMarkProgress({ elapsedMs: 10_000, index: 9, durationMs: 700, staggerMs: 40 }),
    ).toBe(1)
  })
})

describe('toEntranceDurationMs', () => {
  it('should leave room for the last mark to run its full length', () => {
    expect(toEntranceDurationMs({ markCount: 5, durationMs: 700, staggerMs: 40 })).toBe(860)
  })

  it('should not stagger a chart with one mark in it', () => {
    expect(toEntranceDurationMs({ markCount: 1, durationMs: 700, staggerMs: 40 })).toBe(700)
  })
})

describe('toAnimatedCount', () => {
  it('should land on the true count exactly when the bar stops', () => {
    expect(toAnimatedCount({ count: 787, progress: 1 })).toBe(787)
  })

  it('should start from nothing', () => {
    expect(toAnimatedCount({ count: 787, progress: 0 })).toBe(0)
  })

  it('should count in whole people rather than fractions of one', () => {
    expect(Number.isInteger(toAnimatedCount({ count: 787, progress: 0.37 }))).toBe(true)
  })

  it('should never overshoot the true count on the way up', () => {
    const counts = [...Array(51).keys()].map((step) =>
      toAnimatedCount({ count: 112, progress: step / 50 }),
    )

    expect(Math.max(...counts)).toBe(112)
  })
})
