export type TooltipAnchor = {
  x: number
  y: number
}

type ChartTooltipProps = {
  value: string
  label: string
  anchor: TooltipAnchor | undefined
}

/* Darker than the panel it floats over rather than lighter, which is how a
   thing reads as being in front on a dark surface, and blurred to match the
   panel's own treatment. White ink, because there is no light surface anywhere
   on this dashboard any more. */
const TOOLTIP_CLASSES = [
  'pointer-events-none absolute z-10 min-w-28 max-w-56 rounded-[var(--radius-data)]',
  'border border-glass-edge bg-[rgb(9_6_24/0.82)] px-3 py-2 text-on-brand',
  'shadow-lift backdrop-blur-md',
].join(' ')

const PINNED_ANCHOR: TooltipAnchor = { x: 12, y: 8 }

/* The value leads and the name follows, which is the legend's hierarchy turned
   around: by the time somebody has pointed at a mark they know which one it is
   and want the number. Pinned to the top-left on keyboard focus, where a
   pointer position does not exist. */
export const ChartTooltip = ({ value, label, anchor }: ChartTooltipProps) => {
  const { x, y } = anchor ?? PINNED_ANCHOR

  return (
    <div className={TOOLTIP_CLASSES} role="presentation" style={{ left: x, top: y }}>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-xs font-medium text-panel-deep-ink-muted">{label}</p>
    </div>
  )
}
