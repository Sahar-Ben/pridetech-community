import { useCallback, useEffect, useRef } from 'react'
import type { Member } from './member'
import { describeMemberSaveFailure } from './memberSaveFailureText'
import { saveMemberEdit } from './saveMemberEdit'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

export type SaveMember = (options: {
  originalMember: Member
  updatedMember: Member
}) => Promise<void>

/* Rejects on every failure, including an expired session, and the form it was
   called from stays open on the rejection. Resolving quietly after a refused
   write would close the form over an edit the sheet never took, and the
   organiser would have no way of learning that except by reloading. */
export const useMemberSave = ({
  sheetsClient,
  onSessionExpired,
  onSaved,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onSaved: (member: Member) => void
}): SaveMember => {
  const onSessionExpiredRef = useRef(onSessionExpired)
  const onSavedRef = useRef(onSaved)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
    onSavedRef.current = onSaved
  }, [onSaved, onSessionExpired])

  return useCallback(
    async ({ originalMember, updatedMember }): Promise<void> => {
      try {
        await saveMemberEdit({ sheetsClient, originalMember, updatedMember })
      } catch (error: unknown) {
        if (isExpiredSessionError(error)) {
          onSessionExpiredRef.current()
        }
        throw new Error(describeMemberSaveFailure({ member: updatedMember, error }))
      }
      onSavedRef.current(updatedMember)
    },
    [sheetsClient],
  )
}
