import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DistributionBars } from './DistributionBars'
import type { DistributionBucket } from './distribution'

type Frame = (now: number) => void

const stubMotionPreference = (prefersReducedMotion: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches: prefersReducedMotion }))
}

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
  vi.spyOn(performance, 'now').mockReturnValue(0)
  return (now: number) => {
    const pending = [...frames.values()]
    frames.clear()
    act(() => {
      pending.forEach((frame) => frame(now))
    })
  }
}

const bucket = ({
  key,
  count,
  percentage,
  isUnknown = false,
}: {
  key: string
  count: number
  percentage: number
  isUnknown?: boolean
}): DistributionBucket => ({ key, label: key, count, percentage, isUnknown })

const SEVEN_BARS: readonly DistributionBucket[] = [
  bucket({ key: 'first', count: 30, percentage: 30 }),
  bucket({ key: 'second', count: 25, percentage: 25 }),
  bucket({ key: 'third', count: 20, percentage: 20 }),
  bucket({ key: 'fourth', count: 12, percentage: 12 }),
  bucket({ key: 'fifth', count: 8, percentage: 8 }),
  bucket({ key: 'sixth', count: 3, percentage: 3 }),
  bucket({ key: 'not-recorded', count: 2, percentage: 2, isUnknown: true }),
]

const renderBars = (buckets: readonly DistributionBucket[] = SEVEN_BARS) =>
  render(<DistributionBars buckets={buckets} chartLabel="Members by thing" unitNoun="members" />)

const rowFor = (key: string): HTMLElement => screen.getByRole('listitem', { name: new RegExp(key) })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DistributionBars', () => {
  it('should write the value on each of the five largest bars', () => {
    stubMotionPreference(true)

    renderBars()

    const labelled = ['first', 'second', 'third', 'fourth', 'fifth']
    labelled.forEach((key) => {
      expect(within(rowFor(key)).getByText(/^\d+( \(\d+%\))?$/)).toBeInTheDocument()
    })
  })

  it('should leave the sixth largest bar to be read on hover', () => {
    stubMotionPreference(true)

    renderBars()

    expect(within(rowFor('sixth')).queryByText(/^\d+( \(\d+%\))?$/)).not.toBeInTheDocument()
  })

  it('should write the value on a bucket nobody could be placed in, small as it is', () => {
    stubMotionPreference(true)

    renderBars()

    expect(within(rowFor('not-recorded')).getByText(/^2( \(2%\))?$/)).toBeInTheDocument()
  })

  it('should still give an unlabelled bar its value on hover', async () => {
    stubMotionPreference(true)
    renderBars()

    await userEvent.hover(rowFor('sixth'))

    expect(screen.getByText('3 members (3%)')).toBeInTheDocument()
  })

  it('should still give an unlabelled bar its value on keyboard focus', () => {
    stubMotionPreference(true)
    renderBars()

    act(() => {
      rowFor('sixth').focus()
    })

    expect(screen.getByText('3 members (3%)')).toBeInTheDocument()
  })

  it('should write a label on the fill in a different ink from one on the panel', () => {
    stubMotionPreference(true)

    renderBars([
      bucket({ key: 'long', count: 30, percentage: 97 }),
      bucket({ key: 'stub', count: 1, percentage: 3 }),
    ])

    const onFill = within(rowFor('long')).getByText(/^30/)
    const onPanel = within(rowFor('stub')).getByText(/^1/)
    expect(onFill).toHaveClass('fill-chart-on-fill')
    expect(onPanel).toHaveClass('fill-on-brand')
  })

  it('should hand a viewer who asked for less motion the finished values at once', () => {
    stubMotionPreference(true)
    const advanceTo = takeOverAnimationFrames()

    renderBars()

    expect(within(rowFor('first')).getByText(/^30/)).toBeInTheDocument()
    advanceTo(0)
    expect(within(rowFor('first')).getByText(/^30/)).toBeInTheDocument()
  })

  it('should count up from nothing and land exactly on the true value', () => {
    stubMotionPreference(false)
    const advanceTo = takeOverAnimationFrames()
    renderBars()

    expect(within(rowFor('first')).getByText(/^0/)).toBeInTheDocument()

    advanceTo(300)
    const midway = within(rowFor('first')).getByText(/^\d+/).textContent ?? ''
    expect(Number.parseInt(midway, 10)).toBeGreaterThan(0)
    expect(Number.parseInt(midway, 10)).toBeLessThanOrEqual(30)

    advanceTo(10_000)
    expect(within(rowFor('first')).getByText('30 (30%)')).toBeInTheDocument()
  })

  it('should not restart the entrance when a hover re-renders the chart', async () => {
    stubMotionPreference(false)
    const advanceTo = takeOverAnimationFrames()
    renderBars()
    advanceTo(400)
    const beforeHover = Number.parseInt(
      within(rowFor('first')).getByText(/^\d+/).textContent ?? '',
      10,
    )

    await userEvent.hover(rowFor('third'))

    const afterHover = Number.parseInt(
      within(rowFor('first')).getByText(/^\d+/).textContent ?? '',
      10,
    )
    expect(afterHover).toBe(beforeHover)
  })
})
