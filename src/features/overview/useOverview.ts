import { useCallback, useEffect, useRef, useState } from 'react'
import type { Overview } from './buildOverview'
import { loadOverview } from './loadOverview'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Overview could not be built: the Members and Leads tabs could not be read.'

export type OverviewState =
  | { status: 'loading' }
  | { status: 'ready'; overview: Overview }
  | { status: 'failed'; message: string }

export type OverviewResource = {
  state: OverviewState
  reload: () => void
}

type FinishedRead = {
  sheetsClient: SheetsClient
  reloadCount: number
  state: Exclude<OverviewState, { status: 'loading' }>
}

/* The same shape as `useMembers` and `useLeads`: `sheetsClient` identity is the
   reload trigger, so callers must memoise it or every render reads both tabs
   again. `asOf` is taken once per read rather than per render, so a chart
   cannot re-band somebody mid-session. */
export const useOverview = ({
  sheetsClient,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}): OverviewResource => {
  const [finishedRead, setFinishedRead] = useState<FinishedRead | undefined>(undefined)
  const [reloadCount, setReloadCount] = useState(0)
  const onSessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
  }, [onSessionExpired])

  /* Reload and Try again mean from Google: changes made in the sheet itself
     must show, so the short display cache is dropped first (readCache.ts). */
  const reload = useCallback(() => {
    sheetsClient.forgetCachedReads?.()
    setReloadCount((previousCount) => previousCount + 1)
  }, [sheetsClient])

  useEffect(() => {
    let isCurrent = true

    loadOverview({ sheetsClient, asOf: new Date() })
      .then((overview) => {
        if (isCurrent) {
          setFinishedRead({ sheetsClient, reloadCount, state: { status: 'ready', overview } })
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
          reloadCount,
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

  const isFinishedReadCurrent =
    finishedRead !== undefined &&
    finishedRead.sheetsClient === sheetsClient &&
    finishedRead.reloadCount === reloadCount

  return {
    state: isFinishedReadCurrent ? finishedRead.state : { status: 'loading' },
    reload,
  }
}
