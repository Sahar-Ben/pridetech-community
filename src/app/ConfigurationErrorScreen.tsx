type ConfigurationErrorScreenProps = {
  missingKeys: readonly string[]
}

/* Names only. The values are browser credentials rather than secrets, but there
   is no reason for the page to echo them back. */
export const ConfigurationErrorScreen = ({ missingKeys }: ConfigurationErrorScreenProps) => (
  <section className="mx-auto w-full max-w-md px-4 py-16">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
      Google credentials are missing
    </h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
      This app cannot sign in to Google until these values are set in <code>.env.local</code> and
      the dev server is restarted:
    </p>
    <ul className="mt-3 list-inside list-disc text-sm text-slate-900 dark:text-slate-100">
      {missingKeys.map((missingKey) => (
        <li key={missingKey}>
          <code>{missingKey}</code>
        </li>
      ))}
    </ul>
  </section>
)
