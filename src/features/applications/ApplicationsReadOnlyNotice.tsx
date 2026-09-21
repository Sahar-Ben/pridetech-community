const NOTICE_CLASSES =
  'rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 dark:border-rose-500 dark:bg-rose-950'

/* These are real applicants from the real Leads tab, which is exactly why the
   warning is permanent and sits above the queue rather than behind a first click:
   a decision that looks taken and was never written is worse here than it was
   against invented people. Delete this together with its test the day the write
   path lands. */
export const ApplicationsReadOnlyNotice = () => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
      Read-only: Approve and Decline are not connected to the spreadsheet yet.
    </p>
    <p className="mt-0.5 text-sm text-rose-900 dark:text-rose-200">
      These are the real applications in your Leads tab. Nothing you click here changes them: no
      Status cell is written, no Members row is added, and every application stays exactly as it is
      in the sheet.
    </p>
  </div>
)
