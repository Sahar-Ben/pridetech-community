import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const TILE_CLASSES = `${CHART_PANEL_CLASSES} flex flex-col gap-2 p-[18px]`

const FEATURED_TILE_CLASSES = `${CHART_PANEL_CLASSES} col-span-2 flex flex-col gap-3 rounded-[var(--radius-brand-lg)] p-[22px]`

type StatTileProps = {
  label: string
  value: number
  note?: string
  featured?: boolean
  tone?: StatTone
}

/* A number that asks for action wears a colour: the accent for work waiting,
   the warning ink for a problem in the sheet. Neither is the only signal --
   the label under it says what the number is. */
type StatTone = 'plain' | 'accent' | 'warning'

const VALUE_TONE_CLASSES: Readonly<Record<StatTone, string>> = {
  plain: 'text-on-brand',
  accent: 'text-accent',
  warning: 'text-warning-ink',
}

/* A definition list read upside down: the label is first in the markup, where
   it belongs, and `order-first` puts the number above it on screen. Every tile
   starts its number at the same height, so a tile with a note and one without
   still line up across the row.

   Each tile is its own deep panel, the same surface as the chart cards under
   it, so the muted ink the note wears is the one validated for that surface.

   The featured tile is the headline number, the whole row wide: label in
   small monospace, then the number, then its note as a second `dd`. */
export const StatTile = ({
  label,
  value,
  note,
  featured = false,
  tone = 'plain',
}: StatTileProps) =>
  featured ? (
    <div className={FEATURED_TILE_CLASSES}>
      <dt className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="text-[64px] leading-none font-semibold tracking-[-0.05em] text-on-brand sm:text-[76px]">
        {value.toLocaleString('en-US')}
      </dd>
      {note !== undefined && <dd className="text-sm text-ink-muted">{note}</dd>}
    </div>
  ) : (
    <div className={TILE_CLASSES}>
      <dt className="text-sm font-semibold text-on-brand">
        {label}
        {note !== undefined && (
          <span className="mt-1 block text-xs font-normal text-ink-faint">{note}</span>
        )}
      </dt>
      <dd
        className={`order-first text-[34px] leading-none font-semibold tracking-[-0.04em] ${VALUE_TONE_CLASSES[tone]}`}
      >
        {value.toLocaleString('en-US')}
      </dd>
    </div>
  )
