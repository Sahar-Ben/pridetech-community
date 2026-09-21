type SignInScreenProps = {
  errorMessage: string | undefined
  onSignIn: () => void
}

export const SignInScreen = ({ errorMessage, onSignIn }: SignInScreenProps) => (
  <section className="mx-auto w-full max-w-md px-4 py-16">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Sign in to review applications
    </h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
      This app reads the PrideTech Dashboard spreadsheet from your own Google account. It asks for
      access to only the spreadsheet you pick, and to nothing else in your Drive.
    </p>

    {errorMessage !== undefined && (
      <p
        className="mt-4 rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200"
        role="alert"
      >
        {errorMessage}
      </p>
    )}

    <button
      className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      onClick={onSignIn}
      type="button"
    >
      Sign in with Google
    </button>
  </section>
)
