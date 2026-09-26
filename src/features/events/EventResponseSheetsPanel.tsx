import { AttachedSheetRow } from './AttachedSheetRow'
import { AttachResponseSheetForm } from './AttachResponseSheetForm'
import { ResponseSheetTabChoice } from './ResponseSheetTabChoice'
import type { ResponseSheetAttachment } from './attachResponseSheet'
import type { AttachedResponseSheet } from './parseAttachedSheets'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { useAttachResponseSheet } from './useAttachResponseSheet'
import { NoticeBanner } from '../../app/NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const ATTACH_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventResponseSheetsPanelProps = {
  eventId: string
  attachedSheets: readonly AttachedResponseSheet[]
  access: ResponseSheetAccess
  onAttach: (options: { attachment: ResponseSheetAttachment }) => Promise<void>
}

/* A list rather than a field, because an event can have more than one sheet:
   the company evenings collect their own registrations and one of the singles
   nights keeps its waiting list in a spreadsheet of its own. */
export const EventResponseSheetsPanel = ({
  eventId,
  attachedSheets,
  access,
  onAttach,
}: EventResponseSheetsPanelProps) => {
  const attach = useAttachResponseSheet({ access, eventId, onAttach })

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-edge px-4 py-3">
      <h4 className="text-sm font-bold text-ink">Response sheets</h4>

      {attachedSheets.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No response sheet is attached to this event. Attaching one records where the
          registrations live and which column holds what, and the registrants are read from it.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachedSheets.map((sheet) => (
            <AttachedSheetRow key={`${sheet.spreadsheetId}-${sheet.sheetName}`} sheet={sheet} />
          ))}
        </ul>
      )}

      <div aria-live="polite">
        {attach.errorMessage !== undefined && (
          <NoticeBanner role="alert" title={attach.errorMessage} tone="danger" />
        )}
      </div>

      {attach.step.kind === 'choosing-tab' && (
        <ResponseSheetTabChoice
          onCancel={attach.cancel}
          onChoose={attach.chooseTab}
          spreadsheetName={attach.step.spreadsheetName}
          tabNames={attach.step.tabNames}
        />
      )}

      {attach.step.kind === 'mapping' && (
        <AttachResponseSheetForm
          headerRow={attach.step.headerRow}
          isSaving={attach.isBusy}
          onCancel={attach.cancel}
          onSave={attach.save}
          sheetName={attach.step.sheetName}
          spreadsheetName={attach.step.spreadsheetName}
        />
      )}

      {attach.step.kind === 'closed' && (
        <button
          className={`${ATTACH_BUTTON_CLASSES} self-start`}
          disabled={attach.isBusy}
          onClick={attach.start}
          type="button"
        >
          {attach.isBusy ? 'Opening Google Drive\u{2026}' : 'Attach a response sheet'}
        </button>
      )}
    </section>
  )
}
