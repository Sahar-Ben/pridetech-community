const NOTICE_CLASSES =
  'rounded-md border border-emerald-500 bg-emerald-50 px-4 py-3 dark:border-emerald-700 dark:bg-emerald-950'

export const MemberSavedNotice = () => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
      Saved to the Google Sheet.
    </p>
  </div>
)
