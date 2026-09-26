import { describeReadNotes, describeReadingSheets, describeSheetReadProblem } from './registrantsReadText'
import type { SheetReadProblem } from './loadEventRegistrants'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { useAsyncAction } from './useAsyncAction'
import type { EventRegistrantsLoad } from './useEventRegistrants'
import { NoticeBanner } from '../../app/NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES} self-start`

const GIVE_ACCESS_FAILED_MESSAGE = 'Google Drive could not be opened to give access.'

type EventRegistrantsReadStatusProps = {
  load: EventRegistrantsLoad | undefined
  sheetCount: number
  access: ResponseSheetAccess
  onReload: () => void
}

/* The cure for a sheet this organiser cannot open is to pick it themselves:
   that is what hands this app its `drive.file` grant for the file. Picking a
   different file would grant the wrong one and read nothing new, so it is
   refused by name rather than quietly re-read. */
const GiveAccessButton = ({
  problem,
  access,
  onReload,
}: {
  problem: SheetReadProblem
  access: ResponseSheetAccess
  onReload: () => void
}) => {
  const giving = useAsyncAction({ fallbackMessage: GIVE_ACCESS_FAILED_MESSAGE })

  const giveAccess = () => {
    giving.run(async () => {
      const picked = await access.pickSpreadsheet()
      if (picked === undefined) {
        return
      }
      if (picked.spreadsheetId !== problem.sheet.spreadsheetId) {
        throw new Error(
          `That is a different file from the one attached as "${problem.sheet.sheetName}", so nothing was read. Pick the spreadsheet that holds it.`,
        )
      }
      onReload()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button className={BUTTON_CLASSES} disabled={giving.isRunning} onClick={giveAccess} type="button">
        {giving.isRunning ? 'Opening Google Drive\u{2026}' : `Give access to "${problem.sheet.sheetName}"`}
      </button>
      {giving.errorMessage !== undefined && (
        <NoticeBanner role="alert" title={giving.errorMessage} tone="danger" />
      )}
    </div>
  )
}

export const EventRegistrantsReadStatus = ({
  load,
  sheetCount,
  access,
  onReload,
}: EventRegistrantsReadStatusProps) => {
  if (sheetCount === 0) {
    return undefined
  }

  const isReading = load === undefined || load.isReading
  const read = load?.read
  const notes = read === undefined ? [] : describeReadNotes(read)

  return (
    <section aria-label="Reading the response sheets" className="flex flex-col gap-2">
      <div aria-live="polite" className="flex flex-col gap-2">
        {isReading && (
          <p className="text-sm text-ink-muted" role="status">
            {describeReadingSheets(sheetCount)}
          </p>
        )}
        {load?.errorMessage !== undefined && (
          <NoticeBanner role="alert" title={load.errorMessage} tone="danger" />
        )}
      </div>

      {read?.problems.map((problem) => (
        <div className="flex flex-col gap-2" key={`${problem.sheet.spreadsheetId}-${problem.sheet.sheetName}`}>
          <NoticeBanner title={describeSheetReadProblem(problem)} tone="warning" />
          {problem.kind === 'no-access' && (
            <GiveAccessButton access={access} onReload={onReload} problem={problem} />
          )}
        </div>
      ))}

      {notes.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-ink-muted">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <button className={BUTTON_CLASSES} disabled={isReading} onClick={onReload} type="button">
        Read the response sheets again
      </button>
    </section>
  )
}
