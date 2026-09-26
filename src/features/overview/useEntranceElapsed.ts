import { useEffect, useState } from 'react'
import { doesViewerPreferReducedMotion } from './prefersReducedMotion'

/* Milliseconds since the chart mounted, capped at the length of its entrance.

   Whether there is an entrance at all is decided once, at mount, and the
   finished value is then derived during render rather than written into state
   by an effect: a viewer who has asked for reduced motion is handed the end
   state on the first paint, not a frame later.

   The clock itself starts once, so a re-render — a hover, a tooltip, a parent
   settling — cannot restart it. */
export const useEntranceElapsed = (totalMs: number): number => {
  const [isAnimated] = useState(
    () => !doesViewerPreferReducedMotion() && typeof requestAnimationFrame === 'function',
  )
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (!isAnimated) {
      return
    }
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function advance(now: number) {
      const sinceStart = Math.min(totalMs, now - startedAt)
      setElapsedMs(sinceStart)
      if (sinceStart < totalMs) {
        frame = requestAnimationFrame(advance)
      }
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [isAnimated, totalMs])

  return isAnimated ? elapsedMs : totalMs
}
