const NOTICE_CLASSES =
  'rounded-md border-2 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950'

/* Delete this together with the test that asserts it, the day a save reaches
   the Google Sheet. Until then a save only moves React state. */
export const LocalOnlySaveNotice = () => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
      Saved in this browser only.
    </p>
    <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
      This edit has not been written to the Google Sheet, and it will be lost when you reload the
      page. Nothing in this app writes to the sheet yet.
    </p>
  </div>
)
