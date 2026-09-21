import type { CreateAccessTokenRequester } from './accessTokenRequester'
import type { GoogleTokenClient } from '../google/googleGlobals'
import { describeTokenError } from './tokenErrorMessage'

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

const SCRIPT_MISSING_MESSAGE =
  'Google sign-in has not loaded yet. Check your connection and reload the page.'

export const createGoogleAccessTokenRequester = ({
  clientId,
}: {
  clientId: string
}): CreateAccessTokenRequester => {
  return ({ onToken, onError }) => {
    const oauth2 = window.google?.accounts?.oauth2
    if (oauth2 === undefined) {
      throw new Error(SCRIPT_MISSING_MESSAGE)
    }
    const tokenClient: GoogleTokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        const accessToken = response.access_token
        if (accessToken === undefined || accessToken === '') {
          onError(describeTokenError({ type: response.error, message: response.error_description }))
          return
        }
        onToken(accessToken)
      },
      error_callback: (error) => {
        onError(describeTokenError({ type: error.type, message: error.message }))
      },
    })
    return {
      requestAccessToken: () => {
        tokenClient.requestAccessToken()
      },
    }
  }
}
