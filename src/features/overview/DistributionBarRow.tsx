import type { BarChartLayout } from './barChartLayout'
import { toBarValueLabel, toBarValueText } from './barValueLabel'
import { toRoundedEndBarPath } from './chartGeometry'
import {
  BAR_CORNER_RADIUS,
  CHART_LABEL_CLASSES,
  CHART_VALUE_CLASSES,
  CHART_VALUE_ON_FILL_CLASSES,
} from './chartStyles'
import type { DistributionBucket } from './distribution'
import { toAnimatedCount } from './entrance'
import { truncateLabel } from './truncateLabel'

export const BAR_ROW_HEIGHT = 30

const BAR_THICKNESS = 14
const BAR_TOP_OFFSET = (BAR_ROW_HEIGHT - BAR_THICKNESS) / 2
const LABEL_EDGE_PADDING = 8

/* The value fades in over the back half of its own bar's run, so it is already
   sitting where it belongs by the time the bar reaches it. Riding the growing
   end instead would start every inside label outside its bar and jump it in. */
const LABEL_FADE_START = 0.3
const LABEL_FADE_END = 0.7

const toLabelOpacity = (progress: number): number =>
  Math.min(1, Math.max(0, (progress - LABEL_FADE_START) / (LABEL_FADE_END - LABEL_FADE_START)))

type DistributionBarRowProps = {
  bucket: DistributionBucket
  rowTop: number
  barLength: number
  progress: number
  isLabelled: boolean
  isHovered: boolean
  layout: BarChartLayout
  chartWidth: number
  gradientId: string
  accessibleValue: string
  onHover: () => void
  onLeave: () => void
  onFocus: () => void
}

export const DistributionBarRow = ({
  bucket,
  rowTop,
  barLength,
  progress,
  isLabelled,
  isHovered,
  layout,
  chartWidth,
  gradientId,
  accessibleValue,
  onHover,
  onLeave,
  onFocus,
}: DistributionBarRowProps) => {
  const valueLabel = toBarValueLabel({
    count: bucket.count,
    percentage: bucket.percentage,
    barLength,
    valueColumnWidth: layout.valueColumnWidth,
  })
  const countedSoFar = toAnimatedCount({ count: bucket.count, progress })

  return (
    <g
      aria-label={`${bucket.label}: ${accessibleValue}`}
      onBlur={onLeave}
      onFocus={onFocus}
      onPointerEnter={onHover}
      role="listitem"
      tabIndex={0}
    >
      <rect fill="transparent" height={BAR_ROW_HEIGHT} width={chartWidth} x={0} y={rowTop} />
      <text
        className={CHART_LABEL_CLASSES}
        dominantBaseline="middle"
        textAnchor="end"
        x={layout.labelColumnWidth - 10}
        y={rowTop + BAR_ROW_HEIGHT / 2}
      >
        {truncateLabel({ label: bucket.label, maximumCharacters: layout.labelCharacterBudget })}
      </text>
      <g transform={`translate(${layout.labelColumnWidth}, ${rowTop + BAR_TOP_OFFSET})`}>
        <path
          className={`chart-mark ${isHovered ? 'chart-mark-lifted' : ''}`}
          d={toRoundedEndBarPath({
            y: 0,
            length: barLength * progress,
            thickness: BAR_THICKNESS,
            cornerRadius: BAR_CORNER_RADIUS,
          })}
          fill={`url(#${gradientId})`}
          opacity={isHovered ? 0.86 : 1}
        />
      </g>
      {isLabelled && (
        <text
          className={valueLabel.isInside ? CHART_VALUE_ON_FILL_CLASSES : CHART_VALUE_CLASSES}
          dominantBaseline="middle"
          opacity={toLabelOpacity(progress)}
          textAnchor={valueLabel.isInside ? 'end' : 'start'}
          x={
            valueLabel.isInside
              ? layout.labelColumnWidth + barLength - LABEL_EDGE_PADDING
              : layout.labelColumnWidth + barLength + LABEL_EDGE_PADDING
          }
          y={rowTop + BAR_ROW_HEIGHT / 2}
        >
          {toBarValueText({
            count: countedSoFar,
            percentage: toAnimatedCount({ count: bucket.percentage, progress }),
            showsShare: valueLabel.showsShare,
          })}
        </text>
      )}
    </g>
  )
}
