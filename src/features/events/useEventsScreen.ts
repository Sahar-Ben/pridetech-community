import { useCallback, useEffect, useRef, useState } from 'react'
import { readEventsScreen, type EventsScreenData } from './readEventsScreen'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Events tabs could not be read.'

export type EventsScreenState =
  | { status: 'loading' }
  | { status: 'ready'; data: EventsScreenData }
  | { status: 'failed'; message: string }

export type EventsScreenResource = {
  state: EventsScreenState
  reload: () => void
}

type FinishedRead = {
  sheetsClient: SheetsClient
  state: Exclude<EventsScreenState, { status: 'loading' }>
}

/* The same shape as `useMembers` and `useOverview`: `sheetsClient` identity is
   the reload trigger, so callers must memoise it or every render reads the
   registry again. Every write reloads through here rather than patching the
   list in place: an appended event has a row number only the sheet knows, and
   guessing it is how a later edit lands on somebody else's row. */
export const useEventsScreen = ({
  sheetsClient,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}): EventsScreenResource => {
  const [finishedRead, setFinishedRead] = useState<FinishedRead | undefined>(undefined)
  const [reloadCount, setReloadCount] = useState(0)
  const onSessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
  }, [onSessionExpired])

  const reload = useCallback(() => {
    setReloadCount((previousCount) => previousCount + 1)
  }, [])

  useEffect(() => {
    let isCurrent = true

    readEventsScreen({ sheetsClient })
      .then((data) => {
        if (isCurrent) {
          setFinishedRead({ sheetsClient, state: { status: 'ready', data } })
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return
        }
        if (isExpiredSessionError(error)) {
          onSessionExpiredRef.current()
          return
        }
        setFinishedRead({
          sheetsClient,
          state: {
            status: 'failed',
            message: describeError({ error, fallback: READ_FAILED_MESSAGE }),
          },
        })
      })

    return () => {
      isCurrent = false
    }
  }, [reloadCount, sheetsClient])

  /* A reload keeps the last read on screen rather than falling back to the
     loading line. Every write here ends in a reload, and blanking the section
     between the two would unmount the screen the organiser just acted on,
     taking the notice saying what had been written with it. The read is still
     discarded when the spreadsheet or the token changes, because then it is
     about a different spreadsheet. */
  const isFinishedReadCurrent =
    finishedRead !== undefined && finishedRead.sheetsClient === sheetsClient

  return {
    state: isFinishedReadCurrent ? finishedRead.state : { status: 'loading' },
    reload,
  }
}
