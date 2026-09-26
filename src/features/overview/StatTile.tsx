import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const TILE_CLASSES = `${CHART_PANEL_CLASSES} flex flex-col gap-2 px-5 py-4`

type StatTileProps = {
  label: string
  value: number
  note?: string
}

/* A definition list read upside down: the label is first in the markup, where
   it belongs, and `order-first` puts the number above it on screen. Every tile
   starts its number at the same height, so a tile with a note and one without
   still line up across the row.

   Each tile is its own deep panel, the same surface as the chart cards under
   it, so the muted ink the note wears is the one validated for that surface.

   Proportional figures rather than `tabular-nums`, which makes a large
   standalone number look loosely spaced, and Source Sans rather than the
   display face, because this is a value being read rather than a heading being
   looked at. */
export const StatTile = ({ label, value, note }: StatTileProps) => (
  <div className={TILE_CLASSES}>
    <dt className="text-sm font-semibold text-on-brand">
      {label}
      {note !== undefined && (
        <span className="mt-1 block text-xs font-medium text-panel-deep-ink-muted">{note}</span>
      )}
    </dt>
    <dd className="order-first text-4xl leading-none font-bold tracking-tight text-on-brand">
      {value.toLocaleString('en-US')}
    </dd>
  </div>
)
