import { useId, useState, type PointerEvent } from 'react'
import { toBarChartLayout } from './barChartLayout'
import { toBarLengths } from './chartGeometry'
import { ChartFillGradients } from './ChartFillGradients'
import { CHART_AXIS_CLASSES, ENTRANCE_DURATION_MS, ENTRANCE_STAGGER_MS } from './chartStyles'
import { ChartTooltip, type TooltipAnchor } from './ChartTooltip'
import { BAR_ROW_HEIGHT, DistributionBarRow } from './DistributionBarRow'
import type { DistributionBucket } from './distribution'
import { toEntranceDurationMs, toMarkProgress } from './entrance'
import { toLabelledBarKeys } from './labelledBars'
import { useChartWidth } from './useChartWidth'
import { useEntranceElapsed } from './useEntranceElapsed'

const SHORTEST_VISIBLE_BAR = 3
const POINTER_OFFSET = 14

type DistributionBarsProps = {
  buckets: readonly DistributionBucket[]
  chartLabel: string
  unitNoun: string
}

const describeValue = ({
  bucket,
  unitNoun,
}: {
  bucket: DistributionBucket
  unitNoun: string
}): string => `${bucket.count} ${unitNoun} (${bucket.percentage}%)`

export const DistributionBars = ({ buckets, chartLabel, unitNoun }: DistributionBarsProps) => {
  const [hoveredKey, setHoveredKey] = useState<string | undefined>(undefined)
  const [anchor, setAnchor] = useState<TooltipAnchor | undefined>(undefined)
  const { measureElement, chartWidth } = useChartWidth()
  const gradientPrefix = useId()
  const elapsedMs = useEntranceElapsed(
    toEntranceDurationMs({
      markCount: buckets.length,
      durationMs: ENTRANCE_DURATION_MS,
      staggerMs: ENTRANCE_STAGGER_MS,
    }),
  )

  const seriesGradientId = `${gradientPrefix}-series`
  const unknownGradientId = `${gradientPrefix}-unknown`
  const layout = toBarChartLayout(chartWidth)
  const lengths = toBarLengths({
    counts: buckets.map((bucket) => bucket.count),
    trackLength: layout.trackLength,
    minimumLength: SHORTEST_VISIBLE_BAR,
  })
  const labelledKeys = toLabelledBarKeys(buckets)
  const hoveredBucket = buckets.find((bucket) => bucket.key === hoveredKey)
  const chartHeight = buckets.length * BAR_ROW_HEIGHT

  const followPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setAnchor({
      x: event.clientX - bounds.left + POINTER_OFFSET,
      y: event.clientY - bounds.top + POINTER_OFFSET,
    })
  }

  return (
    <div
      className="relative"
      onPointerLeave={() => setHoveredKey(undefined)}
      onPointerMove={followPointer}
      ref={measureElement}
    >
      <svg aria-label={chartLabel} height={chartHeight} role="list" width={chartWidth}>
        <ChartFillGradients
          seriesGradientId={seriesGradientId}
          unknownGradientId={unknownGradientId}
        />
        <line
          className={CHART_AXIS_CLASSES}
          x1={layout.labelColumnWidth}
          x2={layout.labelColumnWidth}
          y1={0}
          y2={chartHeight}
        />
        {buckets.map((bucket, index) => (
          <DistributionBarRow
            accessibleValue={describeValue({ bucket, unitNoun })}
            barLength={lengths[index] ?? 0}
            bucket={bucket}
            chartWidth={chartWidth}
            gradientId={bucket.isUnknown ? unknownGradientId : seriesGradientId}
            isHovered={hoveredKey === bucket.key}
            isLabelled={labelledKeys.has(bucket.key)}
            key={bucket.key}
            layout={layout}
            onFocus={() => {
              setHoveredKey(bucket.key)
              setAnchor(undefined)
            }}
            onHover={() => setHoveredKey(bucket.key)}
            onLeave={() => setHoveredKey(undefined)}
            progress={toMarkProgress({
              elapsedMs,
              index,
              durationMs: ENTRANCE_DURATION_MS,
              staggerMs: ENTRANCE_STAGGER_MS,
            })}
            rowTop={index * BAR_ROW_HEIGHT}
          />
        ))}
      </svg>

      {hoveredBucket !== undefined && (
        <ChartTooltip
          anchor={anchor}
          label={hoveredBucket.label}
          value={describeValue({ bucket: hoveredBucket, unitNoun })}
        />
      )}
    </div>
  )
}
