import { useCallback, useEffect, useMemo, useRef } from 'react'
import { addEventToRegistry } from './addEventToRegistry'
import { attachResponseSheet } from './attachResponseSheet'
import type { EventRegistryWriter } from './eventRegistryWriter'
import { createEventFromDraft } from './eventDraft'
import { createEventId } from './eventId'
import { saveEventToRegistry } from './saveEventToRegistry'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

/* Every write rejects on failure, including an expired session, and the screen
   it was called from stays where it is on the rejection. Resolving quietly
   after a refused write would close a form over a change the sheet never took.

   `onWritten` runs only after the sheet has confirmed, and it is what re-reads
   the registry: an appended event gets its row number from that read. */
export const useEventRegistryWriter = ({
  sheetsClient,
  onSessionExpired,
  onWritten,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onWritten: () => void
}): EventRegistryWriter => {
  const onSessionExpiredRef = useRef(onSessionExpired)
  const onWrittenRef = useRef(onWritten)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
    onWrittenRef.current = onWritten
  }, [onSessionExpired, onWritten])

  const write = useCallback(async (action: () => Promise<void>): Promise<void> => {
    try {
      await action()
    } catch (error: unknown) {
      if (isExpiredSessionError(error)) {
        onSessionExpiredRef.current()
      }
      throw error
    }
    onWrittenRef.current()
  }, [])

  return useMemo(
    () => ({
      addEvent: async ({ draft }) =>
        await write(
          async () =>
            await addEventToRegistry({
              sheetsClient,
              event: createEventFromDraft({ id: createEventId(), draft }),
            }),
        ),

      saveEvent: async ({ originalEvent, updatedEvent }) =>
        await write(
          async () =>
            await saveEventToRegistry({ sheetsClient, originalEvent, updatedEvent }),
        ),

      attachSheet: async ({ attachment }) =>
        await write(async () => await attachResponseSheet({ sheetsClient, attachment })),
    }),
    [sheetsClient, write],
  )
}
