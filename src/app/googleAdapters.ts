import { createGoogleAccessTokenRequester } from '../auth/googleAuth'
import type { CreateAccessTokenRequester } from '../auth/accessTokenRequester'
import type { EnvironmentValues } from '../config/googleConfig'
import { parseGoogleConfig } from '../config/googleConfig'
import { createGoogleSpreadsheetPicker } from '../picker/googlePicker'
import type { PickSpreadsheet } from '../picker/spreadsheetPicker'
import { createWebAuthnDeviceLock, type DeviceLock } from '../lock/deviceLock'

export type GoogleAdapters = {
  createAccessTokenRequester: CreateAccessTokenRequester
  pickSpreadsheet: PickSpreadsheet
  deviceLock: DeviceLock
}

/* Neither adapter touches a Google global until it is called, so building them
   is safe before the two scripts in index.html have finished loading. */
export const buildGoogleAdapters = (
  environment: EnvironmentValues,
): GoogleAdapters | undefined => {
  const config = parseGoogleConfig(environment)
  if (config === undefined) {
    return undefined
  }
  return {
    createAccessTokenRequester: createGoogleAccessTokenRequester({ clientId: config.clientId }),
    pickSpreadsheet: createGoogleSpreadsheetPicker({
      apiKey: config.apiKey,
      appId: config.appId,
    }),
    deviceLock: createWebAuthnDeviceLock(),
  }
}
