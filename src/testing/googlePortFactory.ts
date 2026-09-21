import { vi } from 'vitest'
import type { AccessTokenCallbacks, CreateAccessTokenRequester } from '../auth/accessTokenRequester'
import type { PickedSpreadsheet, PickSpreadsheet } from '../picker/spreadsheetPicker'

export type FakeGoogleTokenPort = {
  createAccessTokenRequester: CreateAccessTokenRequester
  requestAccessToken: ReturnType<typeof vi.fn>
  grantToken: (accessToken: string) => void
  refuseToken: (message: string) => void
}

export const createFakeGoogleTokenPort = (): FakeGoogleTokenPort => {
  let callbacks: AccessTokenCallbacks | undefined
  const requestAccessToken = vi.fn()
  const createAccessTokenRequester: CreateAccessTokenRequester = (given) => {
    callbacks = given
    return { requestAccessToken }
  }
  return {
    createAccessTokenRequester,
    requestAccessToken,
    grantToken: (accessToken) => {
      callbacks?.onToken(accessToken)
    },
    refuseToken: (message) => {
      callbacks?.onError(message)
    },
  }
}

export const createFakeSpreadsheetPicker = (
  spreadsheets: readonly (string | PickedSpreadsheet)[],
): PickSpreadsheet => {
  let pickCount = 0
  return ({ onPicked, onCancelled }) => {
    const picked = spreadsheets[pickCount]
    pickCount = pickCount + 1
    if (picked === undefined) {
      onCancelled()
      return
    }
    onPicked(typeof picked === 'string' ? { spreadsheetId: picked, name: undefined } : picked)
  }
}
