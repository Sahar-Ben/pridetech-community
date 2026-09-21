import { useState, type PointerEvent } from 'react'
import { toPieSlices } from './chartGeometry'
import {
  ENTRANCE_DURATION_MS,
  LEGEND_SWATCH_CLASSES,
  PIE_GAP_DEGREES,
  PIE_SLICE_FILL_CLASSES,
} from './chartStyles'
import { ChartTooltip, type TooltipAnchor } from './ChartTooltip'
import type { Distribution } from './distribution'
import { toAnimatedCount, toBrandEase } from './entrance'
import { useEntranceElapsed } from './useEntranceElapsed'

const RADIUS = 100
const VIEWBOX_EXTENT = 150
const LABEL_RADIUS = 120
const SMALLEST_LABELLED_SWEEP_DEGREES = 26
const POINTER_OFFSET = 14

/* The share is written outside its slice rather than on it: a label set on a
   fill has to be re-checked against that fill every time a step moves, and one
   set on the panel never does. White, because the panel is brand glass. */
const SLICE_LABEL_CLASSES = 'fill-on-brand text-[20px] font-bold'

type GenderPieProps = {
  distribution: Distribution
}

const labelPosition = (midAngleDegrees: number): { x: number; y: number } => {
  const radians = (midAngleDegrees * Math.PI) / 180
  return {
    x: LABEL_RADIUS * Math.sin(radians),
    y: -LABEL_RADIUS * Math.cos(radians),
  }
}

/* Three slices, which is the whole reason this one is a pie: part-to-whole at a
   glance stops working past a handful of segments, and everything else on this
   dashboard has more categories than that. The slice colours are validated
   against the opaque data surface in both themes. */
export const GenderPie = ({ distribution }: GenderPieProps) => {
  const [hoveredKey, setHoveredKey] = useState<string | undefined>(undefined)
  const [anchor, setAnchor] = useState<TooltipAnchor | undefined>(undefined)
  const elapsedMs = useEntranceElapsed(ENTRANCE_DURATION_MS)

  /* One edge travelling clockwise from twelve, rather than three wedges
     inflating from the middle: a pie that grows from its centre reads as a
     zoom, and a pie that sweeps reads as a measurement being taken. */
  const sweptFraction = toBrandEase(elapsedMs / ENTRANCE_DURATION_MS)
  const slices = toPieSlices({
    percentages: distribution.buckets.map((bucket) => bucket.percentage),
    radius: RADIUS,
    gapDegrees: PIE_GAP_DEGREES,
    sweptFraction,
  })
  const hoveredBucket = distribution.buckets.find((bucket) => bucket.key === hoveredKey)

  const followPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setAnchor({
      x: event.clientX - bounds.left + POINTER_OFFSET,
      y: event.clientY - bounds.top + POINTER_OFFSET,
    })
  }

  return (
    <div
      className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6"
      onPointerLeave={() => setHoveredKey(undefined)}
      onPointerMove={followPointer}
    >
      <svg
        aria-label="Gender of active members"
        className="h-52 w-52 shrink-0"
        role="list"
        viewBox={`-${VIEWBOX_EXTENT} -${VIEWBOX_EXTENT} ${VIEWBOX_EXTENT * 2} ${VIEWBOX_EXTENT * 2}`}
      >
        {distribution.buckets.map((bucket, index) => {
          const slice = slices[index]
          if (slice === undefined || slice.path === '') {
            return undefined
          }
          const { x, y } = labelPosition(slice.midAngleDegrees)

          return (
            <g
              aria-label={`${bucket.label}: ${bucket.count} members, ${bucket.percentage}%`}
              key={bucket.key}
              onBlur={() => setHoveredKey(undefined)}
              onFocus={() => {
                setHoveredKey(bucket.key)
                setAnchor(undefined)
              }}
              onPointerEnter={() => setHoveredKey(bucket.key)}
              role="listitem"
              tabIndex={0}
            >
              <path
                className={`chart-mark ${PIE_SLICE_FILL_CLASSES[index % PIE_SLICE_FILL_CLASSES.length]} ${hoveredKey === bucket.key ? 'chart-mark-lifted' : ''}`}
                d={slice.path}
                opacity={hoveredKey === bucket.key ? 0.86 : 1}
              />
              {slice.sweepDegrees >= SMALLEST_LABELLED_SWEEP_DEGREES && (
                <text
                  className={SLICE_LABEL_CLASSES}
                  dominantBaseline="middle"
                  opacity={sweptFraction}
                  textAnchor="middle"
                  x={x}
                  y={y}
                >
                  {toAnimatedCount({ count: bucket.percentage, progress: sweptFraction })}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <ul className="flex w-full flex-col gap-1.5">
        {distribution.buckets.map((bucket, index) => (
          <li className="flex items-center gap-2 text-sm text-on-brand" key={bucket.key}>
            <span
              aria-hidden="true"
              className={`h-3 w-3 shrink-0 rounded-full ${LEGEND_SWATCH_CLASSES[index % LEGEND_SWATCH_CLASSES.length]}`}
            />
            <span className="font-semibold">{bucket.label}</span>
            <span className="font-medium text-panel-deep-ink-muted">
              {bucket.count} ({bucket.percentage}%)
            </span>
          </li>
        ))}
      </ul>

      {hoveredBucket !== undefined && (
        <ChartTooltip
          anchor={anchor}
          label={hoveredBucket.label}
          value={`${hoveredBucket.count} members (${hoveredBucket.percentage}%)`}
        />
      )}
    </div>
  )
}
