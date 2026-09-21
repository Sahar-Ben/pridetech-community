type StatTileProps = {
  label: string
  value: number
  note?: string
}

/* A definition list read upside down: the label is first in the markup, where
   it belongs, and `flex-col-reverse` puts the number above it on screen.

   Proportional figures rather than `tabular-nums`, which makes a large
   standalone number look loosely spaced, and Source Sans rather than the
   display face, because this is a value being read rather than a heading being
   looked at. */
export const StatTile = ({ label, value, note }: StatTileProps) => (
  <div className="flex flex-col-reverse">
    <dt className="text-sm font-semibold text-on-brand">
      {label}
      {note !== undefined && <span className="block text-xs font-medium">{note}</span>}
    </dt>
    <dd className="text-4xl leading-none font-semibold text-on-brand">{value}</dd>
  </div>
)
