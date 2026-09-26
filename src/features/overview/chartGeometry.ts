const DEGREES_PER_PERCENTAGE_POINT = 3.6
const FULL_TURN_DEGREES = 360
const COORDINATE_PRECISION = 3

export type PieSlice = {
  path: string
  startAngleDegrees: number
  sweepDegrees: number
  midAngleDegrees: number
}

const round = (value: number): number => Number(value.toFixed(COORDINATE_PRECISION))

/* Clockwise from twelve o'clock, because that is how a reader describes where a
   slice is. SVG's y axis points down, which is why the cosine is negated here
   and the arcs are all drawn with the sweep flag set. */
const pointAt = ({ angleDegrees, radius }: { angleDegrees: number; radius: number }): string => {
  const radians = (angleDegrees * Math.PI) / 180
  return `${round(radius * Math.sin(radians))} ${round(-radius * Math.cos(radians))}`
}

const fullCirclePath = (radius: number): string =>
  [
    `M ${pointAt({ angleDegrees: 0, radius })}`,
    `A ${radius} ${radius} 0 1 1 ${pointAt({ angleDegrees: 180, radius })}`,
    `A ${radius} ${radius} 0 1 1 ${pointAt({ angleDegrees: 0, radius })}`,
    'Z',
  ].join(' ')

const wedgePath = ({
  startAngleDegrees,
  sweepDegrees,
  radius,
}: {
  startAngleDegrees: number
  sweepDegrees: number
  radius: number
}): string => {
  if (sweepDegrees <= 0) {
    return ''
  }
  if (sweepDegrees >= FULL_TURN_DEGREES) {
    return fullCirclePath(radius)
  }
  const largeArcFlag = sweepDegrees > 180 ? 1 : 0
  return [
    'M 0 0',
    `L ${pointAt({ angleDegrees: startAngleDegrees, radius })}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${pointAt({ angleDegrees: startAngleDegrees + sweepDegrees, radius })}`,
    'Z',
  ].join(' ')
}

/* The gap between slices is the surface showing through rather than a stroke
   drawn around each wedge, so it is taken out of the sweeps. A pie with one
   slice in it has no neighbour to be separated from, and taking the gap anyway
   would leave a visible notch in a circle that is 100% of something. */
export const toPieSlices = ({
  percentages,
  radius,
  gapDegrees,
  sweptFraction = 1,
}: {
  percentages: readonly number[]
  radius: number
  gapDegrees: number
  sweptFraction?: number
}): readonly PieSlice[] => {
  /* The pie arrives the way a clock hand goes round rather than by inflating
     from the middle: one edge travels clockwise from twelve and each slice is
     drawn as far as the edge has reached it. */
  const sweptToAngle = FULL_TURN_DEGREES * Math.min(1, Math.max(0, sweptFraction))
  const drawnSliceCount = percentages.filter((percentage) => percentage > 0).length
  const gap = drawnSliceCount > 1 ? gapDegrees : 0

  return percentages.map((percentage, index) => {
    const precedingShare = percentages
      .slice(0, index)
      .reduce((total, share) => total + share, 0)
    const startAngleDegrees = precedingShare * DEGREES_PER_PERCENTAGE_POINT + gap / 2
    const fullSweepDegrees =
      percentage === 0 ? 0 : percentage * DEGREES_PER_PERCENTAGE_POINT - gap
    const sweepDegrees = Math.min(
      fullSweepDegrees,
      Math.max(0, sweptToAngle - startAngleDegrees),
    )

    return {
      path: wedgePath({ startAngleDegrees, sweepDegrees, radius }),
      startAngleDegrees,
      sweepDegrees,
      midAngleDegrees: startAngleDegrees + fullSweepDegrees / 2,
    }
  })
}

/* Bars are measured against the largest count rather than against the total, so
   the chart fills its track and the comparison the reader is making — this
   category against that one — uses the whole width available for it.
   `minimumLength` keeps a count of one from drawing as nothing at all beside a
   count of a thousand; a count of zero still draws nothing, because it is. */
export const toBarLengths = ({
  counts,
  trackLength,
  minimumLength = 0,
}: {
  counts: readonly number[]
  trackLength: number
  minimumLength?: number
}): readonly number[] => {
  const largestCount = Math.max(0, ...counts)
  if (largestCount === 0) {
    return counts.map(() => 0)
  }
  return counts.map((count) => {
    if (count === 0) {
      return 0
    }
    return Math.max(minimumLength, round((count / largestCount) * trackLength))
  })
}

/* Square where it leaves the baseline, rounded only where the data stops: a bar
   rounded at both ends reads as a pill floating in the track rather than as a
   length measured from zero. A bar shorter than its own corner radius is drawn
   square, because rounding it would shorten it visibly. */
export const toRoundedEndBarPath = ({
  y,
  length,
  thickness,
  cornerRadius,
}: {
  y: number
  length: number
  thickness: number
  cornerRadius: number
}): string => {
  if (length <= 0) {
    return ''
  }
  const bottom = y + thickness
  if (length <= cornerRadius) {
    return `M 0 ${y} H ${round(length)} V ${round(bottom)} H 0 Z`
  }
  const cornerStart = round(length - cornerRadius)
  return [
    `M 0 ${y}`,
    `H ${cornerStart}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 1 ${round(length)} ${round(y + cornerRadius)}`,
    `V ${round(bottom - cornerRadius)}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerStart} ${round(bottom)}`,
    'H 0',
    'Z',
  ].join(' ')
}
