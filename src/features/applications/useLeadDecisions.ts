import { useCallback, useEffect, useRef, useState } from 'react'
import { approveLead } from './approveLead'
import { formatApprovalDate } from './approvalDate'
import { declineLead } from './declineLead'
import { markLeadMaybe } from './markLeadMaybe'
import type {
  ApprovalDecision,
  DeclineDecision,
  DecisionKind,
  MaybeDecision,
} from './decision'
import { describeDecisionFailure } from './decisionFailureText'
import type { Lead } from './lead'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

export type LeadDecisionState = {
  isSaving: boolean
  errorMessage: string | undefined
}

export type LeadDecisions = {
  decidedRowNumbers: ReadonlySet<number>
  stateFor: (rowNumber: number) => LeadDecisionState
  approve: (decision: ApprovalDecision) => void
  decline: (decision: DeclineDecision) => void
  markMaybe: (decision: MaybeDecision) => void
  forgetDecisions: () => void
}

const IDLE: LeadDecisionState = { isSaving: false, errorMessage: undefined }

const withRowNumber = ({
  rowNumbers,
  rowNumber,
}: {
  rowNumbers: ReadonlySet<number>
  rowNumber: number
}): ReadonlySet<number> => new Set([...rowNumbers, rowNumber])

const withoutRowNumber = ({
  rowNumbers,
  rowNumber,
}: {
  rowNumbers: ReadonlySet<number>
  rowNumber: number
}): ReadonlySet<number> => new Set([...rowNumbers].filter((held) => held !== rowNumber))

const withoutError = ({
  errors,
  rowNumber,
}: {
  errors: ReadonlyMap<number, string>
  rowNumber: number
}): ReadonlyMap<number, string> =>
  new Map([...errors].filter(([held]) => held !== rowNumber))

/* The decision a reviewer takes is a write, and a write can fail, so nothing
   here is fire-and-forget: an application leaves the queue only after the sheet
   has confirmed both writes, and a failure leaves the card exactly where it was
   with the reason on it. Removing the card first and hoping would produce the
   one outcome nobody could recover from \u{2014} an applicant who is in no queue, in
   no member list, and in nobody's memory. */
export const useLeadDecisions = ({
  sheetsClient,
  onSessionExpired,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}): LeadDecisions => {
  const [savingRowNumbers, setSavingRowNumbers] = useState<ReadonlySet<number>>(new Set())
  const [decidedRowNumbers, setDecidedRowNumbers] = useState<ReadonlySet<number>>(new Set())
  const [errorByRowNumber, setErrorByRowNumber] = useState<ReadonlyMap<number, string>>(new Map())
  const onSessionExpiredRef = useRef(onSessionExpired)

  /* A ref, not the saving state: two clicks in the same tick both read the same
     render's state, and the second one would start a second write. */
  const rowNumbersInFlight = useRef<Set<number>>(new Set())

  /* Which read the decisions on screen belong to. A write outlives the read it
     was started from - the reviewer can reload while it is still in the air -
     and everything it wants to record afterwards is about rows of that older
     read. It compares this before recording anything, so a write that has been
     superseded can finish, and clean up after itself, without speaking. */
  const readGeneration = useRef(0)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
  }, [onSessionExpired])

  const write = useCallback(
    ({
      kind,
      lead,
      toSheet,
    }: {
      kind: DecisionKind
      lead: Lead
      toSheet: () => Promise<void>
    }): void => {
      const { rowNumber } = lead
      if (rowNumbersInFlight.current.has(rowNumber)) {
        return
      }
      const startedForGeneration = readGeneration.current
      rowNumbersInFlight.current.add(rowNumber)
      setSavingRowNumbers((rowNumbers) => withRowNumber({ rowNumbers, rowNumber }))
      setErrorByRowNumber((errors) => withoutError({ errors, rowNumber }))

      /* Always run, whichever read this write belonged to: the row is being
         written to the sheet right now, and a guard left behind would block the
         reviewer from ever deciding that row again. */
      const finish = (): void => {
        rowNumbersInFlight.current.delete(rowNumber)
        setSavingRowNumbers((rowNumbers) => withoutRowNumber({ rowNumbers, rowNumber }))
      }

      const isStillTheSameRead = (): boolean => readGeneration.current === startedForGeneration

      toSheet()
        .then(() => {
          finish()
          if (!isStillTheSameRead()) {
            return
          }
          setDecidedRowNumbers((rowNumbers) => withRowNumber({ rowNumbers, rowNumber }))
        })
        .catch((error: unknown) => {
          finish()
          /* An expired token is about the session rather than about a row, so
             it is reported whichever read the write started from. */
          if (isExpiredSessionError(error)) {
            onSessionExpiredRef.current()
            return
          }
          if (!isStillTheSameRead()) {
            return
          }
          setErrorByRowNumber(
            (errors) =>
              new Map([
                ...errors,
                [rowNumber, describeDecisionFailure({ decision: kind, lead, error })],
              ]),
          )
        })
    },
    [],
  )

  const approve = useCallback(
    (decision: ApprovalDecision): void => {
      write({
        kind: 'approve',
        lead: decision.lead,
        toSheet: async () =>
          await approveLead({
            sheetsClient,
            decision,
            approvedAt: formatApprovalDate(new Date()),
          }),
      })
    },
    [sheetsClient, write],
  )

  const decline = useCallback(
    (decision: DeclineDecision): void => {
      write({
        kind: 'decline',
        lead: decision.lead,
        toSheet: async () => await declineLead({ sheetsClient, decision }),
      })
    },
    [sheetsClient, write],
  )

  const markMaybe = useCallback(
    (decision: MaybeDecision): void => {
      write({
        kind: 'maybe',
        lead: decision.lead,
        toSheet: async () => await markLeadMaybe({ sheetsClient, decision }),
      })
    },
    [sheetsClient, write],
  )

  /* Row numbers are only meaningful against the read they came from. After a
     fresh read they may point at different people, and a remembered decision
     would then hide somebody nobody has looked at.

     What a write is still doing is not forgotten with them. A write in flight is
     addressing a row of the sheet, not a card, so the row stays guarded and
     stays shown as busy until the sheet answers: clearing either would re-enable
     the buttons over a write that is still running and let a second decision
     append a second member row for the same person. */
  const forgetDecisions = useCallback((): void => {
    readGeneration.current += 1
    setDecidedRowNumbers((rowNumbers) => (rowNumbers.size === 0 ? rowNumbers : new Set()))
    setErrorByRowNumber((errors) => (errors.size === 0 ? errors : new Map()))
  }, [])

  const stateFor = useCallback(
    (rowNumber: number): LeadDecisionState => {
      const errorMessage = errorByRowNumber.get(rowNumber)
      const isSaving = savingRowNumbers.has(rowNumber)
      if (!isSaving && errorMessage === undefined) {
        return IDLE
      }
      return { isSaving, errorMessage }
    },
    [errorByRowNumber, savingRowNumbers],
  )

  return { decidedRowNumbers, stateFor, approve, decline, markMaybe, forgetDecisions }
}
