import { NoticeBanner } from '../../app/NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, SHELL_BUTTON_CLASSES } from '../../theme/controls'
import type { RegistryTabPlans } from './registrySetupPlan'
import { selectUnusableTabs } from './registrySetupPlan'

const RETRY_BUTTON_CLASSES = `mt-4 ${SHELL_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventsRegistryBlockedNoticeProps = {
  plans: RegistryTabPlans
  onRetry: () => void
}

/* A tab of the right name holding somebody else's work. Rewriting its heading
   row would orphan the column of data underneath it, so this says which tab
   and what is wrong with it and stops, and the organiser decides. */
export const EventsRegistryBlockedNotice = ({
  plans,
  onRetry,
}: EventsRegistryBlockedNoticeProps) => (
  <section className="flex flex-col gap-3">
    <NoticeBanner
      detail="Nothing has been written to your spreadsheet."
      role="alert"
      title="The Events tabs cannot be set up as they stand."
      tone="danger"
    />
    {selectUnusableTabs(plans).map((plan) => (
      <NoticeBanner key={plan.tabName} title={plan.reason} tone="warning" />
    ))}
    <button className={`${RETRY_BUTTON_CLASSES} self-start`} onClick={onRetry} type="button">
      Look again
    </button>
  </section>
)
