import { BrandEyebrow } from '../app/BrandEyebrow'
import { NoticeBanner } from '../app/NoticeBanner'
import { PRIMARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from '../theme/controls'
import { GLASS_PANEL_CLASSES, SHELL_HERO_TITLE_CLASSES } from '../theme/surfaces'

const CHOOSE_BUTTON_CLASSES = `mt-7 ${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

type SpreadsheetPickerScreenProps = {
  message: string | undefined
  onChoose: () => void
}

export const SpreadsheetPickerScreen = ({ message, onChoose }: SpreadsheetPickerScreenProps) => (
  <section className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4 py-16">
    <div
      className={`${GLASS_PANEL_CLASSES} animate-rise w-full rounded-[var(--radius-brand-lg)] px-6 py-10 sm:px-10`}
    >
      <BrandEyebrow />

      <h2 className={`mt-5 ${SHELL_HERO_TITLE_CLASSES}`}>
        Choose your spreadsheet
      </h2>
      <p className="mt-4 text-on-brand">
        Pick the <strong className="font-bold">PrideTech Dashboard</strong> spreadsheet. Google
        grants this app access to that one file, and it is remembered in this browser so you only
        pick it once.
      </p>

      {message !== undefined && (
        <div className="mt-6">
          <NoticeBanner role="status" title={message} tone="warning" />
        </div>
      )}

      <button className={CHOOSE_BUTTON_CLASSES} onClick={onChoose} type="button">
        Choose spreadsheet
      </button>
    </div>
  </section>
)
