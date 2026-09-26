/* One hue for the bars, because a bar chart of one series encodes magnitude in
   length and has no identity left to say with colour — colouring each bar
   differently would spend the only free channel restating the bar's length.
   The gradient runs base to a lighter step of that same hue, per bar rather
   than across the track, so it reads as depth and carries no value of its own.

   The grey is not a second series: it is the reserved "we do not know" fill,
   and it means the same thing on every chart here. */
export const SERIES_GRADIENT_STOPS = [
  'text-chart-1-lift',
  'text-chart-1',
] as const

export const UNKNOWN_GRADIENT_STOPS = [
  'text-chart-unknown-lift',
  'text-chart-unknown',
] as const

export const PIE_SLICE_FILL_CLASSES = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3'] as const

export const LEGEND_SWATCH_CLASSES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'] as const

/* Text never wears the series colour: a label in the fill's own hue is either
   illegible or a second, silent encoding. Identity comes from the mark beside
   the words. A value written on top of a fill is the documented exception, and
   `--ui-chart-on-fill` is the one ink allowed there — held above 4.5:1
   against both ends of both gradients.

   On the brand panel the ink is white. The dimmed white used for category
   names is the one the shell's glass cannot have: it clears 9.1:1 here at the
   worst point on the gradient, where over ordinary glass it would be 4.54:1. */
export const CHART_LABEL_CLASSES = 'fill-panel-deep-ink-muted text-[11px]'

export const CHART_VALUE_CLASSES = 'fill-on-brand text-[11px] font-semibold'

export const CHART_VALUE_ON_FILL_CLASSES = 'fill-chart-on-fill text-[11px] font-semibold'

export const CHART_AXIS_CLASSES = 'stroke-panel-deep-ink-muted opacity-35'

/* The gap between a mark and its neighbour is the surface showing through, so
   the marks are drawn with no stroke at all and the separation is spacing. */
export const PIE_GAP_DEGREES = 2

export const BAR_CORNER_RADIUS = 4

export const ENTRANCE_DURATION_MS = 700

export const ENTRANCE_STAGGER_MS = 40
