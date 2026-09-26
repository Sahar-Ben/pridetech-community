import { useCallback, useEffect, useRef } from 'react'
import { applyRegistrySetup } from './registrySetup'
import type { RegistryTabPlans } from './registrySetupPlan'
import { useAsyncAction } from './useAsyncAction'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const SETUP_FAILED_MESSAGE = 'The Events tabs could not be set up, and nothing was written.'

export type EventRegistrySetup = {
  isRunning: boolean
  errorMessage: string | undefined
  run: (plans: RegistryTabPlans) => void
}

/* The plan that was shown to the organiser is the plan that is applied, rather
   than one read again at the moment they press the button: they agreed to a
   named list of tabs, and re-reading could quietly agree to a different one. */
export const useEventRegistrySetup = ({
  sheetsClient,
  onSessionExpired,
  onSetUp,
}: {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onSetUp: () => void
}): EventRegistrySetup => {
  const action = useAsyncAction({ fallbackMessage: SETUP_FAILED_MESSAGE })
  const { run: runAction } = action
  const onSessionExpiredRef = useRef(onSessionExpired)
  const onSetUpRef = useRef(onSetUp)

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired
    onSetUpRef.current = onSetUp
  }, [onSessionExpired, onSetUp])

  const run = useCallback(
    (plans: RegistryTabPlans) => {
      runAction(async () => {
        try {
          await applyRegistrySetup({ sheetsClient, plans })
        } catch (error: unknown) {
          if (isExpiredSessionError(error)) {
            onSessionExpiredRef.current()
          }
          throw error
        }
        onSetUpRef.current()
      })
    },
    [runAction, sheetsClient],
  )

  return { isRunning: action.isRunning, errorMessage: action.errorMessage, run }
}
