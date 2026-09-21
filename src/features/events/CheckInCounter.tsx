type CheckInCounterProps = {
  checkedInCount: number
  expectedCount: number
  lastAction: string | undefined
}

const COUNTER_CLASSES =
  'rounded-2xl border border-hairline bg-surface-raised px-4 py-3 text-ink'

/* One live region, announced politely: a screen reader user at the door hears
   the running total change rather than having to go looking for it. */
export const CheckInCounter = ({
  checkedInCount,
  expectedCount,
  lastAction,
}: CheckInCounterProps) => (
  <p aria-live="polite" className={COUNTER_CLASSES} role="status">
    <span className="block text-2xl leading-tight font-bold text-ink">
      {checkedInCount} of {expectedCount} checked in
    </span>
    {lastAction !== undefined && (
      <span className="mt-0.5 block text-sm font-medium text-ink-muted">{lastAction}</span>
    )}
  </p>
)
