const NOTICE_CLASSES =
  'rounded-md border-2 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950'

/* Speaks only for the edit it is shown next to. It used to add that nothing in
   the app writes to the sheet, which stopped being true the day an approval
   started appending a member row: the sections this renders on are the ones
   still working from sample data, and saying so for all of them would now be
   telling a reviewer their approvals are not landing either. */
export const LocalOnlySaveNotice = () => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
      Saved in this browser only.
    </p>
    <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
      This edit has not been written to the Google Sheet, and it will be lost when you reload the
      page.
    </p>
  </div>
)
