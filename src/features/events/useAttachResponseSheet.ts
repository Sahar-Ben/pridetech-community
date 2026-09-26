import { useCallback, useState } from 'react'
import type { ResponseSheetAttachment } from './attachResponseSheet'
import type { ResponseSheetRole } from './eventRegistryTabs'
import type { ResponseSheetAccess } from './responseSheetAccess'
import type { ResponseSheetMapping } from './responseSheetMapping'
import { useAsyncAction } from './useAsyncAction'

const FAILED_MESSAGE = 'The response sheet could not be read, and nothing was attached.'

const ONLY_TAB_COUNT = 1

/* Picking the file, choosing the tab inside it and confirming what each column
   holds are three steps because they are three different questions, and the
   organiser can only answer each one once the last has been asked. A response
   spreadsheet with a single tab skips the middle question rather than asking
   one with a single answer. */
export type AttachStep =
  | { kind: 'closed' }
  | {
      kind: 'choosing-tab'
      spreadsheetId: string
      spreadsheetName: string | undefined
      tabNames: readonly string[]
    }
  | {
      kind: 'mapping'
      spreadsheetId: string
      spreadsheetName: string | undefined
      sheetName: string
      headerRow: readonly string[]
    }

export type AttachResponseSheet = {
  step: AttachStep
  isBusy: boolean
  errorMessage: string | undefined
  start: () => void
  chooseTab: (sheetName: string) => void
  save: (options: { role: ResponseSheetRole; mapping: ResponseSheetMapping }) => void
  cancel: () => void
}

export const useAttachResponseSheet = ({
  access,
  eventId,
  onAttach,
}: {
  access: ResponseSheetAccess
  eventId: string
  onAttach: (options: { attachment: ResponseSheetAttachment }) => Promise<void>
}): AttachResponseSheet => {
  const [step, setStep] = useState<AttachStep>({ kind: 'closed' })
  const action = useAsyncAction({ fallbackMessage: FAILED_MESSAGE })
  const { run, forgetError } = action

  const openMapping = useCallback(
    async ({
      spreadsheetId,
      spreadsheetName,
      sheetName,
    }: {
      spreadsheetId: string
      spreadsheetName: string | undefined
      sheetName: string
    }): Promise<void> => {
      const headerRow = await access.readHeaderRow({ spreadsheetId, sheetName })
      setStep({ kind: 'mapping', spreadsheetId, spreadsheetName, sheetName, headerRow })
    },
    [access],
  )

  const start = useCallback(() => {
    run(async () => {
      const picked = await access.pickSpreadsheet()
      if (picked === undefined) {
        return
      }
      const { spreadsheetId, name: spreadsheetName } = picked
      const tabNames = await access.readTabNames({ spreadsheetId })
      const onlyTabName = tabNames.length === ONLY_TAB_COUNT ? tabNames[0] : undefined
      if (onlyTabName === undefined) {
        setStep({ kind: 'choosing-tab', spreadsheetId, spreadsheetName, tabNames })
        return
      }
      await openMapping({ spreadsheetId, spreadsheetName, sheetName: onlyTabName })
    })
  }, [access, openMapping, run])

  const chooseTab = useCallback(
    (sheetName: string) => {
      if (step.kind !== 'choosing-tab') {
        return
      }
      const { spreadsheetId, spreadsheetName } = step
      run(async () => {
        await openMapping({ spreadsheetId, spreadsheetName, sheetName })
      })
    },
    [openMapping, run, step],
  )

  const save = useCallback(
    ({ role, mapping }: { role: ResponseSheetRole; mapping: ResponseSheetMapping }) => {
      if (step.kind !== 'mapping') {
        return
      }
      const { spreadsheetId, sheetName } = step
      run(async () => {
        await onAttach({
          attachment: { eventId, spreadsheetId, sheetName, role, mapping },
        })
        setStep({ kind: 'closed' })
      })
    },
    [eventId, onAttach, run, step],
  )

  const cancel = useCallback(() => {
    forgetError()
    setStep({ kind: 'closed' })
  }, [forgetError])

  return {
    step,
    isBusy: action.isRunning,
    errorMessage: action.errorMessage,
    start,
    chooseTab,
    save,
    cancel,
  }
}
