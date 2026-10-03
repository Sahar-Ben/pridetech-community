import { BrandEyebrow } from '../app/BrandEyebrow'
import { NoticeBanner } from '../app/NoticeBanner'
import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../theme/controls'
import { GLASS_PANEL_CLASSES, SHELL_HERO_TITLE_CLASSES } from '../theme/surfaces'

const UNLOCK_BUTTON_CLASSES = `mt-7 ${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

type LockScreenProps = {
  message: string | undefined
  isBusy: boolean
  onUnlock: () => void
}

/* Built like the sign-in screen it sits in front of. Unlocking waits for a
   tap: Safari only shows the Face ID sheet in answer to one. */
export const LockScreen = ({ message, isBusy, onUnlock }: LockScreenProps) => (
  <section className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-16">
    <div
      className={`${GLASS_PANEL_CLASSES} animate-rise w-full rounded-[var(--radius-brand-lg)] px-6 py-10 sm:px-10`}
    >
      <BrandEyebrow />

      <h2 className={`mt-5 ${SHELL_HERO_TITLE_CLASSES}`}>The app is locked</h2>
      <p className="mt-4 text-on-brand">
        Unlock with Face ID to carry on. If Face ID does not work, your device offers its passcode
        instead.
      </p>

      {message !== undefined && (
        <div className="mt-6">
          <NoticeBanner role="alert" title={message} tone="danger" />
        </div>
      )}

      <button
        className={UNLOCK_BUTTON_CLASSES}
        disabled={isBusy}
        onClick={onUnlock}
        type="button"
      >
        Unlock with Face ID
      </button>

      <p className="mt-6 text-sm text-on-brand">
        Deleted the passkey? Clear this site's data in your browser settings, or remove the app from
        your home screen and add it again, then sign in with Google.
      </p>
    </div>
  </section>
)
