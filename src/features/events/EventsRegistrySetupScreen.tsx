import { NoticeBanner } from '../../app/NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, PRIMARY_BUTTON_CLASSES } from '../../theme/controls'
import { DATA_PANEL_CLASSES, RECORD_TITLE_CLASSES } from '../../theme/surfaces'
import type { RegistryTabPlans } from './registrySetupPlan'
import { describeRegistrySetupAction, describeRegistryTabPlan } from './registrySetupText'

const PANEL_CLASSES = `${DATA_PANEL_CLASSES} animate-rise flex flex-col gap-4 px-4 py-5 sm:px-6`

const SET_UP_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventsRegistrySetupScreenProps = {
  plans: RegistryTabPlans
  isSettingUp: boolean
  errorMessage: string | undefined
  onSetUp: () => void
}

/* Told before it happens, per tab, in the organiser's own terms. This is the
   first thing in the app that changes the structure of a spreadsheet somebody
   has kept by hand for two years, and the difference between adding a tab and
   filling in the headings of one they already made is the difference between
   two quite different promises. */
export const EventsRegistrySetupScreen = ({
  plans,
  isSettingUp,
  errorMessage,
  onSetUp,
}: EventsRegistrySetupScreenProps) => (
  <section className={PANEL_CLASSES}>
    <h3 className={RECORD_TITLE_CLASSES}>Set up the Events tabs</h3>

    <p className="text-sm text-ink">
      Nothing in your spreadsheet records events yet, so this app keeps them in three tabs of
      their own.
    </p>

    <p className="text-sm font-bold text-ink">{describeRegistrySetupAction(plans)}</p>

    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
      {plans.map((plan) => (
        <li key={plan.tabName}>{describeRegistryTabPlan(plan)}</li>
      ))}
    </ul>

    <p className="text-sm text-ink-muted">
      No existing tab, row or cell is read, moved or overwritten. If you would rather try this on
      a copy first, make one in Google Sheets and pick it with &ldquo;Change
      spreadsheet&rdquo;.
    </p>

    <div aria-live="polite">
      {errorMessage !== undefined && (
        <NoticeBanner role="alert" title={errorMessage} tone="danger" />
      )}
    </div>

    <button
      className={`${SET_UP_BUTTON_CLASSES} self-start`}
      disabled={isSettingUp}
      onClick={onSetUp}
      type="button"
    >
      {isSettingUp ? 'Setting up\u{2026}' : 'Set up the tabs'}
    </button>
  </section>
)
