import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AccessTokenCallbacks, CreateAccessTokenRequester } from './accessTokenRequester'
import { SESSION_EXPIRED_MESSAGE, useGoogleAuth } from './useGoogleAuth'

const createFakeGoogle = () => {
  let callbacks: AccessTokenCallbacks | undefined
  const requestAccessToken = vi.fn()
  const createAccessTokenRequester: CreateAccessTokenRequester = (given) => {
    callbacks = given
    return { requestAccessToken }
  }
  const grantToken = (accessToken: string) => {
    callbacks?.onToken(accessToken)
  }
  const refuseToken = (message: string) => {
    callbacks?.onError(message)
  }
  return { createAccessTokenRequester, requestAccessToken, grantToken, refuseToken }
}

describe('useGoogleAuth', () => {
  it('should start signed out', () => {
    const google = createFakeGoogle()

    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    expect(result.current.accessToken).toBeUndefined()
    expect(result.current.errorMessage).toBeUndefined()
  })

  it('should not ask Google for a token client before sign-in is attempted', () => {
    const google = createFakeGoogle()

    renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    expect(google.requestAccessToken).not.toHaveBeenCalled()
  })

  it('should expose the access token after a successful sign-in', () => {
    const google = createFakeGoogle()
    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    act(() => {
      result.current.signIn()
    })
    act(() => {
      google.grantToken('token-1')
    })

    expect(google.requestAccessToken).toHaveBeenCalledTimes(1)
    expect(result.current.accessToken).toBe('token-1')
  })

  it('should surface the error when the user dismisses the consent dialog', () => {
    const google = createFakeGoogle()
    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    act(() => {
      result.current.signIn()
    })
    act(() => {
      google.refuseToken('popup_closed')
    })

    expect(result.current.accessToken).toBeUndefined()
    expect(result.current.errorMessage).toBe('popup_closed')
  })

  it('should clear an earlier error once sign-in succeeds', () => {
    const google = createFakeGoogle()
    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    act(() => {
      result.current.signIn()
    })
    act(() => {
      google.refuseToken('popup_closed')
    })
    act(() => {
      google.grantToken('token-1')
    })

    expect(result.current.errorMessage).toBeUndefined()
    expect(result.current.accessToken).toBe('token-1')
  })

  it('should report signed out again once the token is cleared', () => {
    const google = createFakeGoogle()
    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    act(() => {
      result.current.signIn()
    })
    act(() => {
      google.grantToken('token-1')
    })
    act(() => {
      result.current.signOut()
    })

    expect(result.current.accessToken).toBeUndefined()
    expect(result.current.errorMessage).toBeUndefined()
  })

  it('should explain that the session expired when a sheet call reports an expired token', () => {
    const google = createFakeGoogle()
    const { result } = renderHook(() =>
      useGoogleAuth({ createAccessTokenRequester: google.createAccessTokenRequester }),
    )

    act(() => {
      result.current.signIn()
    })
    act(() => {
      google.grantToken('token-1')
    })
    act(() => {
      result.current.reportExpiredSession()
    })

    expect(result.current.accessToken).toBeUndefined()
    expect(result.current.errorMessage).toBe(SESSION_EXPIRED_MESSAGE)
  })

  it('should surface a message instead of throwing when the Google script has not loaded', () => {
    const createAccessTokenRequester: CreateAccessTokenRequester = () => {
      throw new Error('Google Identity Services has not loaded yet')
    }
    const { result } = renderHook(() => useGoogleAuth({ createAccessTokenRequester }))

    act(() => {
      result.current.signIn()
    })

    expect(result.current.errorMessage).toBe('Google Identity Services has not loaded yet')
    expect(result.current.accessToken).toBeUndefined()
  })
})
