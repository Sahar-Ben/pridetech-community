import { useCallback, useRef, useState } from 'react'
import type { AccessTokenRequester, CreateAccessTokenRequester } from './accessTokenRequester'
import { describeError } from '../errors/describeError'

export const SESSION_EXPIRED_MESSAGE =
  'Your Google session expired. Sign in again to keep reviewing applications.'

const SIGN_IN_FAILED_MESSAGE = 'Google sign-in could not be started.'

export type GoogleAuth = {
  accessToken: string | undefined
  errorMessage: string | undefined
  signIn: () => void
  signOut: () => void
  reportExpiredSession: () => void
}

/* `createAccessTokenRequester` must be stable across renders: the token client is
   built once, on the first sign-in attempt, because the Google script loads async
   and is usually still absent when this hook first runs. */
export const useGoogleAuth = ({
  createAccessTokenRequester,
}: {
  createAccessTokenRequester: CreateAccessTokenRequester
}): GoogleAuth => {
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const requesterRef = useRef<AccessTokenRequester | undefined>(undefined)

  const signIn = useCallback(() => {
    try {
      if (requesterRef.current === undefined) {
        requesterRef.current = createAccessTokenRequester({
          onToken: (grantedToken) => {
            setAccessToken(grantedToken)
            setErrorMessage(undefined)
          },
          onError: (message) => {
            setAccessToken(undefined)
            setErrorMessage(message)
          },
        })
      }
      requesterRef.current.requestAccessToken()
    } catch (error) {
      setErrorMessage(describeError({ error, fallback: SIGN_IN_FAILED_MESSAGE }))
    }
  }, [createAccessTokenRequester])

  const signOut = useCallback(() => {
    setAccessToken(undefined)
    setErrorMessage(undefined)
  }, [])

  const reportExpiredSession = useCallback(() => {
    setAccessToken(undefined)
    setErrorMessage(SESSION_EXPIRED_MESSAGE)
  }, [])

  return { accessToken, errorMessage, signIn, signOut, reportExpiredSession }
}
