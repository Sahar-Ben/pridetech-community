import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGoogleAccessTokenRequester, DRIVE_FILE_SCOPE } from './googleAuth'
import type { GoogleTokenClientConfig } from '../google/googleGlobals'

const stubGoogleIdentityServices = () => {
  const requestAccessToken = vi.fn()
  const initTokenClient = vi.fn((_config: GoogleTokenClientConfig) => ({ requestAccessToken }))
  window.google = { accounts: { oauth2: { initTokenClient } } }
  const configPassedToGoogle = (): GoogleTokenClientConfig => {
    const [config] = initTokenClient.mock.calls[0] ?? []
    if (config === undefined) {
      throw new Error('no token client was created')
    }
    return config
  }
  return { requestAccessToken, initTokenClient, configPassedToGoogle }
}

afterEach(() => {
  delete window.google
})

describe('createGoogleAccessTokenRequester', () => {
  it('should ask Google for the drive.file scope and nothing else', () => {
    const googleIdentityServices = stubGoogleIdentityServices()
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    createRequester({ onToken: vi.fn(), onError: vi.fn() })

    const config = googleIdentityServices.configPassedToGoogle()
    expect(config.client_id).toBe('client-1')
    expect(config.scope).toBe(DRIVE_FILE_SCOPE)
    expect(config.scope).toBe('https://www.googleapis.com/auth/drive.file')
  })

  it('should open the Google consent flow when a token is requested', () => {
    const googleIdentityServices = stubGoogleIdentityServices()
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    const requester = createRequester({ onToken: vi.fn(), onError: vi.fn() })
    requester.requestAccessToken()

    expect(googleIdentityServices.requestAccessToken).toHaveBeenCalledTimes(1)
  })

  it('should hand the granted access token back to the app', () => {
    const googleIdentityServices = stubGoogleIdentityServices()
    const onToken = vi.fn()
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    createRequester({ onToken, onError: vi.fn() })
    googleIdentityServices.configPassedToGoogle().callback({ access_token: 'token-1' })

    expect(onToken).toHaveBeenCalledWith('token-1')
  })

  it('should report a response that carries an error instead of a token', () => {
    const googleIdentityServices = stubGoogleIdentityServices()
    const onError = vi.fn()
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    createRequester({ onToken: vi.fn(), onError })
    googleIdentityServices.configPassedToGoogle().callback({
      error: 'access_denied',
      error_description: 'The user denied the request',
    })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/declined/i))
  })

  it('should report a closed consent window through the error callback', () => {
    const googleIdentityServices = stubGoogleIdentityServices()
    const onError = vi.fn()
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    createRequester({ onToken: vi.fn(), onError })
    googleIdentityServices.configPassedToGoogle().error_callback({ type: 'popup_closed' })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/closed/i))
  })

  it('should say the script has not loaded rather than failing on an undefined global', () => {
    const createRequester = createGoogleAccessTokenRequester({ clientId: 'client-1' })

    expect(() => createRequester({ onToken: vi.fn(), onError: vi.fn() })).toThrow(
      /has not loaded yet/i,
    )
  })
})
