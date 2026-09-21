const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/* Asked once, when a chart mounts, rather than subscribed to: somebody who
   turns the setting on mid-session wants the next screen calm, not this one
   snapping to its end state under their cursor. */
export const doesViewerPreferReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
