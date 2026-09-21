const ALERT_CLASSES =
  'rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200'

const RETRY_BUTTON_CLASSES =
  'mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

type SectionErrorNoticeProps = {
  message: string
  onRetry: () => void
}

/* A failed read says what failed and offers the read again, rather than
   rendering the empty screen a successful read of an empty tab would produce. */
export const SectionErrorNotice = ({ message, onRetry }: SectionErrorNoticeProps) => (
  <section className="mx-auto w-full max-w-3xl px-4 py-10">
    <p className={ALERT_CLASSES} role="alert">
      {message}
    </p>
    <button className={RETRY_BUTTON_CLASSES} onClick={onRetry} type="button">
      Try again
    </button>
  </section>
)
