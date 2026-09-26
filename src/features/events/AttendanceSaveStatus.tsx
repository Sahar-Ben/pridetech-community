import type { AttendanceResource } from './useAttendance'
import { NoticeBanner } from '../../app/NoticeBanner'

export type AttendanceSaveState = Pick<
  AttendanceResource,
  'hasRead' | 'isReading' | 'savingCount' | 'readError' | 'saveError'
>

/* The door needs to know two things at a glance: that the taps are landing,
   and when one did not. Everything else stays out of the way. */
const describeSaving = ({ hasRead, savingCount }: AttendanceSaveState): string => {
  if (!hasRead) {
    return 'Reading who has already checked in\u{2026}'
  }
  if (savingCount > 0) {
    return `Saving ${savingCount} to the Attendance tab\u{2026}`
  }
  return 'Every check-in is saved to the Attendance tab.'
}

export const AttendanceSaveStatus = ({ state }: { state: AttendanceSaveState }) => (
  <div aria-live="polite" className="flex flex-col gap-2">
    <p className="text-sm font-semibold text-ink">{describeSaving(state)}</p>
    {state.saveError !== undefined && (
      <NoticeBanner role="alert" title={state.saveError} tone="danger" />
    )}
    {state.readError !== undefined && (
      <NoticeBanner
        detail="Check-ins made on another phone may be missing from this list until it reads again."
        role="alert"
        title={state.readError}
        tone="warning"
      />
    )}
  </div>
)
