import { useState } from 'react'
import { useAsyncAction } from './useAsyncAction'
import { NoticeBanner } from '../../app/NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const FAILED_MESSAGE = 'Google Drive could not be opened to give access.'

const describeGranted = (count: number): string =>
  count === 1
    ? 'The app can now read the sheet you picked.'
    : `The app can now read the ${count} sheets you picked.`

/* This app only reads the files each organiser has picked themselves, so an
   RSVP sheet somebody else attached, or one a script made, is out of reach
   until it is picked here. Picking them all at once is the only way twenty
   past events do not cost twenty visits to the picker. */
export const GiveSheetAccessButton = ({
  onGiveAccess,
}: {
  onGiveAccess: () => Promise<number>
}) => {
  const giving = useAsyncAction({ fallbackMessage: FAILED_MESSAGE })
  const [grantedCount, setGrantedCount] = useState<number | undefined>(undefined)

  const giveAccess = () => {
    setGrantedCount(undefined)
    giving.run(async () => {
      const count = await onGiveAccess()
      setGrantedCount(count === 0 ? undefined : count)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button className={BUTTON_CLASSES} disabled={giving.isRunning} onClick={giveAccess} type="button">
        {giving.isRunning ? 'Opening Google Drive\u{2026}' : 'Give access to event sheets'}
      </button>
      <div aria-live="polite">
        {grantedCount !== undefined && (
          <p className="text-sm font-semibold text-on-brand">{describeGranted(grantedCount)}</p>
        )}
        {giving.errorMessage !== undefined && (
          <NoticeBanner role="alert" title={giving.errorMessage} tone="danger" />
        )}
      </div>
    </div>
  )
}
