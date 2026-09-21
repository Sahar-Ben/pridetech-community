import { SERIES_GRADIENT_STOPS, UNKNOWN_GRADIENT_STOPS } from './chartStyles'

/* `stopColor="currentColor"` with a Tailwind text utility on the stop is what
   lets a gradient follow the theme: `stop-color` takes no `var()` from a
   utility class, but it does inherit `color`, and `--ui-chart-*` is already
   re-pointed per theme.

   The ids are handed in rather than fixed, because a dashboard draws four of
   these and two gradients sharing an id in one document is two charts sharing
   one definition by accident. */
const GradientStops = ({ stops }: { stops: readonly [string, string] }) => (
  <>
    <stop className={stops[0]} offset="0%" stopColor="currentColor" />
    <stop className={stops[1]} offset="100%" stopColor="currentColor" />
  </>
)

type ChartFillGradientsProps = {
  seriesGradientId: string
  unknownGradientId: string
}

export const ChartFillGradients = ({
  seriesGradientId,
  unknownGradientId,
}: ChartFillGradientsProps) => (
  <defs>
    {/* Object bounding box, so every bar spans the same two steps whatever its
        length and the gradient never encodes the value. */}
    <linearGradient id={seriesGradientId} x1="0" x2="1" y1="0" y2="1">
      <GradientStops stops={SERIES_GRADIENT_STOPS} />
    </linearGradient>
    <linearGradient id={unknownGradientId} x1="0" x2="1" y1="0" y2="1">
      <GradientStops stops={UNKNOWN_GRADIENT_STOPS} />
    </linearGradient>
  </defs>
)
