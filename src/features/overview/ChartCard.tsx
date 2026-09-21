import type { ReactNode } from 'react'
import { ProvenanceBadge } from './ProvenanceBadge'
import type { Provenance } from './provenance'
import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const CARD_CLASSES = `${CHART_PANEL_CLASSES} animate-rise flex flex-col gap-3 px-5 py-4`

type ChartCardProps = {
  title: string
  provenance: Provenance
  howItWasBuilt: string
  unknownNote: string
  chart: ReactNode
  table: ReactNode
}

/* The sentence saying how the numbers were arrived at sits directly under the
   heading, above the chart, because a caveat under a chart is read after the
   reader has already believed it. */
export const ChartCard = ({
  title,
  provenance,
  howItWasBuilt,
  unknownNote,
  chart,
  table,
}: ChartCardProps) => (
  <section className={CARD_CLASSES}>
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight text-on-brand">{title}</h3>
        <ProvenanceBadge provenance={provenance} />
      </div>
      <p className="text-sm font-medium text-panel-deep-ink-muted">{howItWasBuilt}</p>
    </header>

    {chart}

    <p className="text-sm font-semibold text-on-brand">{unknownNote}</p>

    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-panel-deep-ink-muted">
        Show the numbers
      </summary>
      <div className="mt-2 overflow-x-auto">{table}</div>
    </details>
  </section>
)
