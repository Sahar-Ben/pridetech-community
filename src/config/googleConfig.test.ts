import { describe, expect, it } from 'vitest'
import { findMissingGoogleConfigKeys, parseGoogleConfig } from './googleConfig'

const COMPLETE_ENVIRONMENT = {
  VITE_GOOGLE_CLIENT_ID: 'client-id',
  VITE_GOOGLE_API_KEY: 'api-key',
  VITE_GOOGLE_APP_ID: 'app-id',
}

describe('googleConfig', () => {
  it('should read the three browser credentials from the environment', () => {
    expect(parseGoogleConfig(COMPLETE_ENVIRONMENT)).toEqual({
      clientId: 'client-id',
      apiKey: 'api-key',
      appId: 'app-id',
    })
  })

  it('should report nothing missing when all three are present', () => {
    expect(findMissingGoogleConfigKeys(COMPLETE_ENVIRONMENT)).toEqual([])
  })

  it('should name each key that is absent or blank', () => {
    expect(
      findMissingGoogleConfigKeys({ ...COMPLETE_ENVIRONMENT, VITE_GOOGLE_API_KEY: '  ' }),
    ).toEqual(['VITE_GOOGLE_API_KEY'])
    expect(findMissingGoogleConfigKeys({})).toEqual([
      'VITE_GOOGLE_CLIENT_ID',
      'VITE_GOOGLE_API_KEY',
      'VITE_GOOGLE_APP_ID',
    ])
  })

  it('should refuse to build a config when a credential is missing', () => {
    expect(parseGoogleConfig({ VITE_GOOGLE_CLIENT_ID: 'client-id' })).toBeUndefined()
  })
})
