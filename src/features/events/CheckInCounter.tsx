type CheckInCounterProps = {
  checkedInCount: number
  expectedCount: number
  lastAction: string | undefined
}

/* One live region, announced politely: a screen reader user at the door hears
   the running total change rather than having to go looking for it. */
export const CheckInCounter = ({
  checkedInCount,
  expectedCount,
  lastAction,
}: CheckInCounterProps) => (
  <p
    aria-live="polite"
    className="rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800"
    role="status"
  >
    <span className="block text-lg font-semibold text-slate-900 dark:text-slate-100">
      {checkedInCount} of {expectedCount} checked in
    </span>
    {lastAction !== undefined && (
      <span className="block text-sm text-slate-600 dark:text-slate-400">{lastAction}</span>
    )}
  </p>
)
