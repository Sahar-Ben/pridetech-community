import { describe, expect, it } from 'vitest'
import { buildGoogleAdapters } from './googleAdapters'

const COMPLETE_ENVIRONMENT = {
  VITE_GOOGLE_CLIENT_ID: 'client-id',
  VITE_GOOGLE_API_KEY: 'api-key',
  VITE_GOOGLE_APP_ID: 'app-id',
}

describe('buildGoogleAdapters', () => {
  it('should build both Google adapters when the credentials are configured', () => {
    const adapters = buildGoogleAdapters(COMPLETE_ENVIRONMENT)

    expect(typeof adapters?.createAccessTokenRequester).toBe('function')
    expect(typeof adapters?.pickSpreadsheet).toBe('function')
  })

  it('should build nothing when a credential is missing', () => {
    expect(buildGoogleAdapters({ VITE_GOOGLE_CLIENT_ID: 'client-id' })).toBeUndefined()
  })

  it('should not reach for a Google global while building', () => {
    expect(() => buildGoogleAdapters(COMPLETE_ENVIRONMENT)).not.toThrow()
    expect(window.google).toBeUndefined()
  })
})
