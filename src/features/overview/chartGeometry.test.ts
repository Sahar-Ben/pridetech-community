import { describe, expect, it } from 'vitest'
import { toBarLengths, toPieSlices, toRoundedEndBarPath } from './chartGeometry'

const sliceOf = ({
  percentages,
  index,
}: {
  percentages: readonly number[]
  index: number
}) => toPieSlices({ percentages, radius: 100, gapDegrees: 2 })[index]

describe('toPieSlices', () => {
  it('should draw one slice per share', () => {
    expect(toPieSlices({ percentages: [50, 25, 25], radius: 100, gapDegrees: 2 })).toHaveLength(3)
  })

  it('should start the first slice at the top of the circle', () => {
    const [first] = toPieSlices({ percentages: [50, 50], radius: 100, gapDegrees: 0 })

    expect(first?.startAngleDegrees).toBeCloseTo(0)
    expect(first?.midAngleDegrees).toBeCloseTo(90)
  })

  it('should put the second slice below the first, going clockwise', () => {
    expect(sliceOf({ percentages: [50, 50], index: 1 })?.midAngleDegrees).toBeCloseTo(270)
  })

  it('should give a larger share a larger sweep', () => {
    const [big, small] = toPieSlices({ percentages: [75, 25], radius: 100, gapDegrees: 0 })

    expect(big?.sweepDegrees).toBeCloseTo(270)
    expect(small?.sweepDegrees).toBeCloseTo(90)
  })

  it('should separate neighbouring slices with a gap taken out of each sweep', () => {
    const [first] = toPieSlices({ percentages: [50, 50], radius: 100, gapDegrees: 4 })

    expect(first?.sweepDegrees).toBeCloseTo(176)
  })

  it('should draw a share nobody is in as no slice at all', () => {
    const slices = toPieSlices({ percentages: [100, 0], radius: 100, gapDegrees: 2 })

    expect(slices[1]?.path).toBe('')
  })

  it('should draw a single full share as a circle rather than a zero-length arc', () => {
    const [only] = toPieSlices({ percentages: [100], radius: 100, gapDegrees: 2 })

    expect(only?.path).toContain('A')
    expect(only?.sweepDegrees).toBeCloseTo(360)
  })

  it('should draw nothing when there are no shares', () => {
    expect(toPieSlices({ percentages: [], radius: 100, gapDegrees: 2 })).toEqual([])
  })
})

describe('toBarLengths', () => {
  it('should give the largest count the full track', () => {
    expect(toBarLengths({ counts: [4, 2, 1], trackLength: 200 })).toEqual([200, 100, 50])
  })

  it('should keep a bar of one visible rather than collapsing it to nothing', () => {
    const [, smallest] = toBarLengths({ counts: [1000, 1], trackLength: 200, minimumLength: 3 })

    expect(smallest).toBe(3)
  })

  it('should draw no bar at all for a count of zero', () => {
    expect(toBarLengths({ counts: [4, 0], trackLength: 200, minimumLength: 3 })[1]).toBe(0)
  })

  it('should draw nothing when every count is zero', () => {
    expect(toBarLengths({ counts: [0, 0], trackLength: 200 })).toEqual([0, 0])
  })

  it('should draw nothing when there is nothing to draw', () => {
    expect(toBarLengths({ counts: [], trackLength: 200 })).toEqual([])
  })
})

describe('toRoundedEndBarPath', () => {
  it('should round only the end the data reaches, leaving the baseline square', () => {
    const path = toRoundedEndBarPath({ y: 0, length: 100, thickness: 14, cornerRadius: 4 })

    expect(path.startsWith('M 0 0')).toBe(true)
    expect(path).toContain('A 4 4')
    expect(path.split('A').length - 1).toBe(2)
  })

  it('should square off a bar too short to take the corner', () => {
    const path = toRoundedEndBarPath({ y: 0, length: 2, thickness: 14, cornerRadius: 4 })

    expect(path).not.toContain('A')
  })

  it('should draw nothing for a bar of no length', () => {
    expect(toRoundedEndBarPath({ y: 0, length: 0, thickness: 14, cornerRadius: 4 })).toBe('')
  })
})

describe('toPieSlices while the pie is still sweeping in', () => {
  const sweptAt = (sweptFraction: number) =>
    toPieSlices({ percentages: [50, 50], radius: 100, gapDegrees: 0, sweptFraction })

  it('should draw nothing before the sweep starts', () => {
    expect(sweptAt(0).map((slice) => slice.path)).toEqual(['', ''])
  })

  it('should draw the first slice before it reaches the second', () => {
    const [first, second] = sweptAt(0.25)

    expect(first?.sweepDegrees).toBeCloseTo(90)
    expect(second?.sweepDegrees).toBe(0)
  })

  it('should hold a slice the sweep has already passed at its full size', () => {
    const [first] = sweptAt(0.75)

    expect(first?.sweepDegrees).toBeCloseTo(180)
  })

  it('should draw the whole pie once the sweep has gone round', () => {
    expect(sweptAt(1).map((slice) => slice.sweepDegrees)).toEqual([180, 180])
  })

  it('should draw the finished pie when no sweep is asked for', () => {
    const finished = toPieSlices({ percentages: [50, 50], radius: 100, gapDegrees: 0 })

    expect(finished.map((slice) => slice.sweepDegrees)).toEqual([180, 180])
  })
})
