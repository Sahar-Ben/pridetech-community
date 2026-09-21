const BEZIER_CONTROL = { firstX: 0.22, firstY: 1, secondX: 0.36, secondY: 1 } as const

const SOLVER_STEPS = 24

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

const bezierAt = ({ time, first, second }: { time: number; first: number; second: number }): number => {
  const inverse = 1 - time
  return (
    3 * inverse * inverse * time * first + 3 * inverse * time * time * second + time * time * time
  )
}

/* `--ease-brand` evaluated in JavaScript, because the thing being animated is a
   path length and a counting number rather than a CSS property, and an
   entrance that eased differently from every other movement in the app would
   be the one that looks wrong. Bisection rather than Newton: the curve is
   fixed, two dozen steps land well inside a pixel, and there is no derivative
   to get wrong. */
export const toBrandEase = (progress: number): number => {
  const target = clamp(progress)
  if (target === 0 || target === 1) {
    return target
  }
  let low = 0
  let high = 1
  for (let step = 0; step < SOLVER_STEPS; step += 1) {
    const middle = (low + high) / 2
    const x = bezierAt({
      time: middle,
      first: BEZIER_CONTROL.firstX,
      second: BEZIER_CONTROL.secondX,
    })
    if (x < target) {
      low = middle
    } else {
      high = middle
    }
  }
  return bezierAt({
    time: (low + high) / 2,
    first: BEZIER_CONTROL.firstY,
    second: BEZIER_CONTROL.secondY,
  })
}

/* A sweep rather than a twitch: each mark starts a beat after the one above it,
   so the eye is led down the chart instead of being shown everything moving at
   once. */
export const toMarkProgress = ({
  elapsedMs,
  index,
  durationMs,
  staggerMs,
}: {
  elapsedMs: number
  index: number
  durationMs: number
  staggerMs: number
}): number => toBrandEase((elapsedMs - index * staggerMs) / durationMs)

export const toEntranceDurationMs = ({
  markCount,
  durationMs,
  staggerMs,
}: {
  markCount: number
  durationMs: number
  staggerMs: number
}): number => durationMs + Math.max(0, markCount - 1) * staggerMs

/* Rounded down while it runs and handed the true count at the end, so the
   number a reader reads off a settled chart is the number in the sheet rather
   than whatever the last frame rounded to. */
export const toAnimatedCount = ({
  count,
  progress,
}: {
  count: number
  progress: number
}): number => (progress >= 1 ? count : Math.floor(count * clamp(progress)))
