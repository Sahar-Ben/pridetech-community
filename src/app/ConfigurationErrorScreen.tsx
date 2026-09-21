import { GLASS_PANEL_CLASSES, SHELL_HERO_TITLE_CLASSES } from '../theme/surfaces'

type ConfigurationErrorScreenProps = {
  missingKeys: readonly string[]
}

const CODE_CLASSES = 'rounded-md bg-glass px-1.5 py-0.5 font-mono text-[0.9em]'

/* Names only. The values are browser credentials rather than secrets, but there
   is no reason for the page to echo them back. */
export const ConfigurationErrorScreen = ({ missingKeys }: ConfigurationErrorScreenProps) => (
  <section className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-16">
    <div className={`${GLASS_PANEL_CLASSES} animate-rise w-full px-6 py-8 sm:px-8`}>
      <h2 className={SHELL_HERO_TITLE_CLASSES}>
        Google credentials are missing
      </h2>
      <p className="mt-3 text-on-brand">
        This app cannot sign in to Google until these values are set in{' '}
        <code className={CODE_CLASSES}>.env.local</code> and the dev server is restarted:
      </p>
      <ul className="mt-4 flex flex-col items-start gap-1.5 text-on-brand">
        {missingKeys.map((missingKey) => (
          <li key={missingKey}>
            <code className={CODE_CLASSES}>{missingKey}</code>
          </li>
        ))}
      </ul>
    </div>
  </section>
)
