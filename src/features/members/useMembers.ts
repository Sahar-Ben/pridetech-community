import { useCallback, useEffect, useRef, useState } from 'react'
import { loadMembers } from './loadMembers'
import type { Member } from './member'
import { replaceMember } from './memberUpdates'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Members tab could not be read.'

export type MembersState =
  | { status: 'loading' }
  | { status: 'ready'; members: readonly Member[] }
  | { status: 'failed'; message: string }

export type MembersResource = {
  state: MembersState
  reload: () => void
  replaceLoadedMember: (member: Member) => void
}

type FinishedRead = {
  sheetsClient: SheetsClient
  reloadCount: number
  state: Exclude<MembersState, { status: 'loading' }>
}

/* `sheetsClient` identity is the reload trigger, the way it is for the leads
   read: a new client means a new spreadsheet or a new token. Callers must
   memoise it, or every render starts another read of all 787 rows. */
export const useMembers = ({
  sheetsClient,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}): MembersResource => {
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

    loadMembers({ sheetsClient })
      .then((members) => {
        if (isCurrent) {
          setFinishedRead({ sheetsClient, reloadCount, state: { status: 'ready', members } })
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

  /* A saved member is put back into the loaded list rather than triggering a
     re-read: the sheet has already confirmed the cells, and re-reading 787 rows
     to learn one of them would lose the organiser's place in the directory. */
  const replaceLoadedMember = useCallback((member: Member) => {
    setFinishedRead((read) => {
      if (read === undefined || read.state.status !== 'ready') {
        return read
      }
      return {
        ...read,
        state: {
          status: 'ready',
          members: replaceMember({ members: read.state.members, updatedMember: member }),
        },
      }
    })
  }, [])

  const isFinishedReadCurrent =
    finishedRead !== undefined &&
    finishedRead.sheetsClient === sheetsClient &&
    finishedRead.reloadCount === reloadCount

  return {
    state: isFinishedReadCurrent ? finishedRead.state : { status: 'loading' },
    reload,
    replaceLoadedMember,
  }
}
