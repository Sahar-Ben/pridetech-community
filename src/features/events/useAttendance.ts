import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toAttendanceKey, type AttendanceEntry } from './attendanceLog'
import type { AttendanceStore } from './attendanceStore'
import { describeError } from '../../errors/describeError'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const READ_FAILED_MESSAGE = 'The Attendance tab could not be read.'

export type AttendanceResource = {
  /* What the sheet held at the last read, followed by every tap made here that
     the sheet has not been seen to hold yet. */
  entries: readonly AttendanceEntry[]
  hasRead: boolean
  isReading: boolean
  savingCount: number
  readError: string | undefined
  saveError: string | undefined
  request: () => void
  reload: () => void
  record: (entry: AttendanceEntry) => void
}

type LocalEntry = { entry: AttendanceEntry; isSaved: boolean }

const isSameEntry = (left: AttendanceEntry, right: AttendanceEntry): boolean =>
  left.eventId === right.eventId &&
  toAttendanceKey(left) === toAttendanceKey(right) &&
  left.status === right.status &&
  left.at === right.at

const describeSaveFailure = ({ entry, error }: { entry: AttendanceEntry; error: unknown }): string =>
  `${entry.status === 'attended' ? 'The check-in' : 'Undoing the check-in'} of ${entry.name} was not saved, so it has been taken back. Try again. ${describeError({ error, fallback: '' })}`.trim()

/* A tap shows at once and is written behind it, one write at a time in the
   order they were made: two writes racing would let "checked in" land after
   the "undone" that followed it, and the log's last word would be the wrong
   one. A tap stays on screen until a read shows the sheet holding it, so a
   read that was already on its way when the write landed cannot take it back
   off the screen. */
export const useAttendance = ({
  store,
  onSessionExpired,
}: {
  store: AttendanceStore
  onSessionExpired: () => void
}): AttendanceResource => {
  const [readEntries, setReadEntries] = useState<readonly AttendanceEntry[] | undefined>(undefined)
  const [localEntries, setLocalEntries] = useState<readonly LocalEntry[]>([])
  const [isReading, setIsReading] = useState(false)
  const [readError, setReadError] = useState<string | undefined>(undefined)
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  const writeQueue = useRef<Promise<void>>(Promise.resolve())
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
    setIsReading(true)
    store
      .readEntries()
      .then((entries) => {
        if (thisRead !== readNumber.current) {
          return
        }
        setReadEntries(entries)
        setReadError(undefined)
        setLocalEntries((current) =>
          current.filter(
            (local) => !local.isSaved || !entries.some((read) => isSameEntry(read, local.entry)),
          ),
        )
      })
      .catch((error: unknown) => {
        if (thisRead !== readNumber.current) {
          return
        }
        if (isExpiredSessionError(error)) {
          onSessionExpiredRef.current()
          return
        }
        setReadError(describeError({ error, fallback: READ_FAILED_MESSAGE }))
      })
      .finally(() => {
        if (thisRead === readNumber.current) {
          setIsReading(false)
        }
      })
  }, [store])

  const request = useCallback(() => {
    if (!hasRequested.current) {
      reload()
    }
  }, [reload])

  const record = useCallback(
    (entry: AttendanceEntry) => {
      setSaveError(undefined)
      setLocalEntries((current) => [...current, { entry, isSaved: false }])
      writeQueue.current = writeQueue.current
        .then(async () => await store.appendEntry(entry))
        .then(() => {
          setLocalEntries((current) =>
            current.map((local) => (local.entry === entry ? { ...local, isSaved: true } : local)),
          )
        })
        .catch((error: unknown) => {
          setLocalEntries((current) => current.filter((local) => local.entry !== entry))
          if (isExpiredSessionError(error)) {
            onSessionExpiredRef.current()
          }
          setSaveError(describeSaveFailure({ entry, error }))
        })
    },
    [store],
  )

  const entries = useMemo(() => {
    const read = readEntries ?? []
    const unseen = localEntries
      .filter((local) => !local.isSaved || !read.some((entry) => isSameEntry(entry, local.entry)))
      .map((local) => local.entry)
    return [...read, ...unseen]
  }, [localEntries, readEntries])

  return {
    entries,
    hasRead: readEntries !== undefined,
    isReading,
    savingCount: localEntries.filter((local) => !local.isSaved).length,
    readError,
    saveError,
    request,
    reload,
    record,
  }
}
