type SpreadsheetPickerScreenProps = {
  message: string | undefined
  onChoose: () => void
}

export const SpreadsheetPickerScreen = ({ message, onChoose }: SpreadsheetPickerScreenProps) => (
  <section className="mx-auto w-full max-w-md px-4 py-16">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Choose your spreadsheet
    </h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
      Pick the <strong>PrideTech Dashboard</strong> spreadsheet. Google grants this app access to
      that one file, and it is remembered in this browser so you only pick it once.
    </p>

    {message !== undefined && (
      <p
        className="mt-4 rounded-md border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200"
        role="status"
      >
        {message}
      </p>
    )}

    <button
      className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      onClick={onChoose}
      type="button"
    >
      Choose spreadsheet
    </button>
  </section>
)
