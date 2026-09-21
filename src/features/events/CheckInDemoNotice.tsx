const NOTICE_CLASSES =
  'rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 dark:border-rose-500 dark:bg-rose-950'

/* Standing at a real door with this screen open is the way this app could do
   actual harm: an evening of taps that looked recorded and were not. The
   warning is permanent and sits above the list, not behind a first tap. */
export const CheckInDemoNotice = () => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
      Do not use this at a real door. Attendance is not being recorded anywhere.
    </p>
    <p className="mt-0.5 text-sm text-rose-900 dark:text-rose-200">
      Everyone listed here is invented sample data. Taps stay in this browser tab, nothing is
      written to the Google Sheet, and every check-in is lost the moment the page reloads.
    </p>
  </div>
)
