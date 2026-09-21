import { useCallback, useEffect, useRef, useState } from 'react'
import { loadLeads } from './loadLeads'
import type { Lead } from './lead'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Leads tab could not be read.'

export type LeadsState =
  | { status: 'loading' }
  | { status: 'ready'; leads: readonly Lead[] }
  | { status: 'failed'; message: string }

export type LeadsResource = {
  state: LeadsState
  reload: () => void
}

type FinishedRead = {
  sheetsClient: SheetsClient
  reloadCount: number
  state: Exclude<LeadsState, { status: 'loading' }>
}

/* `sheetsClient` identity is the reload trigger: a new client means a new
   spreadsheet or a new token, and the tab is read again. Callers must memoise it,
   or every render starts another read of all 1,000-odd rows. */
export const useLeads = ({
  sheetsClient,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}): LeadsResource => {
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

    loadLeads({ sheetsClient })
      .then((leads) => {
        if (isCurrent) {
          setFinishedRead({ sheetsClient, reloadCount, state: { status: 'ready', leads } })
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
