import { BrandEyebrow } from '../app/BrandEyebrow'
import { NoticeBanner } from '../app/NoticeBanner'
import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../theme/controls'
import { GLASS_PANEL_CLASSES, SHELL_HERO_TITLE_CLASSES } from '../theme/surfaces'

const SIGN_IN_BUTTON_CLASSES = `mt-7 ${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

type SignInScreenProps = {
  errorMessage: string | undefined
  onSignIn: () => void
}

/* The one screen with no data on it, so it is the one screen allowed to be the
   website: 44px glass, Sulphur Point at display size, nothing to read at length. */
export const SignInScreen = ({ errorMessage, onSignIn }: SignInScreenProps) => (
  <section className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-16">
    <div
      className={`${GLASS_PANEL_CLASSES} animate-rise w-full rounded-[var(--radius-brand-lg)] px-6 py-10 sm:px-10`}
    >
      <BrandEyebrow />

      <h2 className={`mt-5 ${SHELL_HERO_TITLE_CLASSES}`}>
        Sign in to review applications
      </h2>
      <p className="mt-4 text-on-brand">
        This app reads the PrideTech Dashboard spreadsheet from your own Google account. It asks
        for access to only the spreadsheet you pick, and to nothing else in your Drive.
      </p>

      {errorMessage !== undefined && (
        <div className="mt-6">
          <NoticeBanner role="alert" title={errorMessage} tone="danger" />
        </div>
      )}

      <button className={SIGN_IN_BUTTON_CLASSES} onClick={onSignIn} type="button">
        Sign in with Google
      </button>
    </div>
  </section>
)
