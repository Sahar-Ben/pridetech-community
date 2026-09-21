import { useCallback, useEffect, useRef, useState } from 'react'
import type { LeadsReview } from './leadsReview'
import { loadLeadsReview } from './loadLeadsReview'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Leads and Members tabs could not be read.'

export type LeadsState =
  | { status: 'loading' }
  | { status: 'ready'; review: LeadsReview }
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
   spreadsheet or a new token, and both tabs are read again. Callers must memoise
   it, or every render starts another read of all 1,000-odd rows. The review is
   built once here, off the render path, so the queue never refilters per render. */
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

    loadLeadsReview({ sheetsClient })
      .then((review) => {
        if (isCurrent) {
          setFinishedRead({ sheetsClient, reloadCount, state: { status: 'ready', review } })
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
