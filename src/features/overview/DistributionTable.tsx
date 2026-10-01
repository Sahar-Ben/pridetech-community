import type { DistributionBucket } from './distribution'

const CELL_CLASSES = 'px-3 py-1.5 text-left'

const NUMERIC_CELL_CLASSES = 'px-3 py-1.5 text-right tabular-nums'

type DistributionTableProps = {
  buckets: readonly DistributionBucket[]
  caption: string
  categoryHeading: string
}

/* Every chart on this screen has one of these under it, because these are
   numbers about real people and reaching them must not depend on seeing a
   wedge or hovering a bar. It is also where a label the bar chart had to
   shorten is written out in full. */
export const DistributionTable = ({
  buckets,
  caption,
  categoryHeading,
}: DistributionTableProps) => (
  <table className="w-full border-collapse text-sm text-on-brand">
    <caption className="sr-only">{caption}</caption>
    <thead>
      <tr className="border-b border-glass-edge font-mono text-[11px] font-medium tracking-[0.08em] text-ink-muted">
        <th className={CELL_CLASSES} scope="col">
          {categoryHeading}
        </th>
        <th className={NUMERIC_CELL_CLASSES} scope="col">
          Members
        </th>
        <th className={NUMERIC_CELL_CLASSES} scope="col">
          Share
        </th>
      </tr>
    </thead>
    <tbody>
      {buckets.map((bucket) => (
        <tr className="border-b border-glass-edge last:border-0" key={bucket.key}>
          <th className={`${CELL_CLASSES} font-medium`} scope="row">
            {bucket.label}
          </th>
          <td className={NUMERIC_CELL_CLASSES}>{bucket.count}</td>
          <td className={NUMERIC_CELL_CLASSES}>{bucket.percentage}%</td>
        </tr>
      ))}
    </tbody>
  </table>
)
