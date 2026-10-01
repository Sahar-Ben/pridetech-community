import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadEventRegistrants, type EventRegistrantsRead } from './loadEventRegistrants'
import { selectSheetsForEvent, type AttachedResponseSheet } from './parseAttachedSheets'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { describeError } from '../../errors/describeError'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = "The event's response sheets could not be read."

/* `read` survives a re-read, so the list the organiser is looking at does not
   blank out under them while it refreshes; `isReading` says a newer one is on
   its way. */
export type EventRegistrantsLoad = {
  read: EventRegistrantsRead | undefined
  isReading: boolean
  errorMessage: string | undefined
}

export type EventRegistrantsResource = {
  loads: ReadonlyMap<string, EventRegistrantsLoad>
  /* Reads an event's sheets the first time it is asked for, and not again. */
  request: (eventId: string) => void
  /* Reads them again, for the registrations that arrived since. */
  reload: (eventId: string) => void
}

type Entry = { signature: string; load: EventRegistrantsLoad }

const EMPTY_READ: EventRegistrantsRead = {
  registrants: [],
  repeatedCount: 0,
  rowsWithoutNameOrEmail: [],
  problems: [],
}

/* What a read of an event depends on. When somebody attaches a sheet, or
   attaches one again with a corrected mapping, this changes and the read that
   was made against the old set is stale. */
const describeSheets = (sheets: readonly AttachedResponseSheet[]): string =>
  JSON.stringify(
    sheets.map(({ spreadsheetId, sheetName, role, mapping }) => [
      spreadsheetId,
      sheetName,
      role,
      mapping ?? null,
    ]),
  )

/* Registrants are read an event at a time, when the event is opened, rather
   than all at once with the events list. Every attached sheet is a separate
   read against a separate file, Google allows a signed-in person only so many
   reads a minute, and the list re-reads itself after every change made to an
   event: reading twenty-odd sheets on each of those would run the quota out on
   an evening the door depends on it. */
export const useEventRegistrants = ({
  access,
  attachedSheets,
  onSessionExpired,
}: {
  access: ResponseSheetAccess
  attachedSheets: readonly AttachedResponseSheet[]
  onSessionExpired: () => void
}): EventRegistrantsResource => {
  const [entries, setEntries] = useState<ReadonlyMap<string, Entry>>(new Map())
  const entriesRef = useRef(entries)
  const attachedSheetsRef = useRef(attachedSheets)
  const latestRequestRef = useRef(new Map<string, number>())
  const onSessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    entriesRef.current = entries
    attachedSheetsRef.current = attachedSheets
    onSessionExpiredRef.current = onSessionExpired
  })

  const setEntry = useCallback((eventId: string, entry: Entry) => {
    setEntries((current) => new Map(current).set(eventId, entry))
  }, [])

  const readEvent = useCallback(
    (eventId: string) => {
      const sheets = selectSheetsForEvent({ sheets: attachedSheetsRef.current, eventId })
      const signature = describeSheets(sheets)
      const requestNumber = (latestRequestRef.current.get(eventId) ?? 0) + 1
      latestRequestRef.current.set(eventId, requestNumber)
      const isLatest = () => latestRequestRef.current.get(eventId) === requestNumber

      if (sheets.length === 0) {
        setEntry(eventId, {
          signature,
          load: { read: EMPTY_READ, isReading: false, errorMessage: undefined },
        })
        return
      }

      const previous = entriesRef.current.get(eventId)?.load.read
      setEntry(eventId, {
        signature,
        load: { read: previous, isReading: true, errorMessage: undefined },
      })

      loadEventRegistrants({ access, sheets })
        .then((read) => {
          if (isLatest()) {
            setEntry(eventId, {
              signature,
              load: { read, isReading: false, errorMessage: undefined },
            })
          }
        })
        .catch((error: unknown) => {
          if (!isLatest()) {
            return
          }
          if (isExpiredSessionError(error)) {
            onSessionExpiredRef.current()
            return
          }
          setEntry(eventId, {
            signature,
            load: {
              read: previous,
              isReading: false,
              errorMessage: describeError({ error, fallback: READ_FAILED_MESSAGE }),
            },
          })
        })
    },
    [access, setEntry],
  )

  const request = useCallback(
    (eventId: string) => {
      if (!entriesRef.current.has(eventId)) {
        readEvent(eventId)
      }
    },
    [readEvent],
  )

  /* A sheet attached to an event that has already been read makes that read
     stale, so it is read again rather than left showing the old list. Events
     nobody has opened are left alone: they will be read when they are. */
  useEffect(() => {
    entriesRef.current.forEach((entry, eventId) => {
      const signature = describeSheets(selectSheetsForEvent({ sheets: attachedSheets, eventId }))
      if (entry.signature !== signature) {
        readEvent(eventId)
      }
    })
  }, [attachedSheets, readEvent])

  const loads = useMemo(
    () => new Map([...entries].map(([eventId, entry]) => [eventId, entry.load])),
    [entries],
  )

  /* "Read again" means from Google, not from the few-seconds-old copy. */
  const reload = useCallback(
    (eventId: string) => {
      access.forgetCachedReads?.()
      readEvent(eventId)
    },
    [access, readEvent],
  )

  return { loads, request, reload }
}
