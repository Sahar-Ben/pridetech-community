import { useCallback, useRef, useState } from 'react'
import { describeError } from '../../errors/describeError'

export type AsyncAction = {
  isRunning: boolean
  errorMessage: string | undefined
  run: (action: () => Promise<void>) => void
  forgetError: () => void
}

/* A write that fails leaves the screen exactly as the organiser left it, with
   the reason on it. The alternative — closing the form, clearing the row,
   moving on — loses the change and says nothing, and the sheet is unchanged
   either way, so nothing on screen would ever show that it happened.

   The in-flight guard is a ref rather than the state, because two clicks in the
   same tick both read the same render's state and the second would start a
   second write. */
export const useAsyncAction = ({ fallbackMessage }: { fallbackMessage: string }): AsyncAction => {
  const [isRunning, setIsRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const isInFlight = useRef(false)

  const forgetError = useCallback(() => {
    setErrorMessage(undefined)
  }, [])

  const run = useCallback(
    (action: () => Promise<void>) => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setErrorMessage(undefined)
      setIsRunning(true)

      action()
        .catch((error: unknown) => {
          setErrorMessage(describeError({ error, fallback: fallbackMessage }))
        })
        .finally(() => {
          isInFlight.current = false
          setIsRunning(false)
        })
    },
    [fallbackMessage],
  )

  return { isRunning, errorMessage, run, forgetError }
}
