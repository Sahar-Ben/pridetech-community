import { useCallback, useEffect, useRef, useState } from 'react'
import { loadCommunityEventHistory, type CommunityEventHistory } from './loadCommunityEventHistory'
import type { ResponseSheetAccess } from '../events/responseSheetAccess'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The events could not be read.'

export type CommunityEventHistoryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; history: CommunityEventHistory }
  | { status: 'failed'; message: string }

export type CommunityEventHistoryResource = {
  state: CommunityEventHistoryState
  request: () => void
  reload: () => void
}

/* Read the first time a member is opened, and kept: every attached sheet is a
   read of its own, and reading them all again for each member opened would
   spend Google's per-minute allowance in a few clicks. */
export const useCommunityEventHistory = ({
  sheetsClient,
  access,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  access: ResponseSheetAccess
  onSessionExpired: () => void
}): CommunityEventHistoryResource => {
  const [state, setState] = useState<CommunityEventHistoryState>({ status: 'idle' })
  const readNumber = useRef(0)
  const hasRequested = useRef(false)
  const onSessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
  }, [onSessionExpired])

  const reload = useCallback(() => {
    hasRequested.current = true
    readNumber.current += 1
    const thisRead = readNumber.current
    setState({ status: 'loading' })
    loadCommunityEventHistory({ sheetsClient, access })
      .then((history) => {
        if (thisRead === readNumber.current) {
          setState({ status: 'ready', history })
        }
      })
      .catch((error: unknown) => {
        if (thisRead !== readNumber.current) {
          return
        }
        if (isExpiredSessionError(error)) {
          onSessionExpiredRef.current()
          return
        }
        setState({ status: 'failed', message: describeError({ error, fallback: READ_FAILED_MESSAGE }) })
      })
  }, [access, sheetsClient])

  const request = useCallback(() => {
    if (!hasRequested.current) {
      reload()
    }
  }, [reload])

  return { state, request, reload }
}
