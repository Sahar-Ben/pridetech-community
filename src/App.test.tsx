import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

afterEach(() => {
  vi.unstubAllEnvs()
})

const stubCredentials = ({
  clientId = 'test-client-id',
  apiKey = 'test-api-key',
  appId = 'test-app-id',
}: {
  clientId?: string
  apiKey?: string
  appId?: string
} = {}) => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', clientId)
  vi.stubEnv('VITE_GOOGLE_API_KEY', apiKey)
  vi.stubEnv('VITE_GOOGLE_APP_ID', appId)
}

describe('App', () => {
  it('should open on the Google sign-in screen', () => {
    stubCredentials()

    render(<App />)

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('should show no community data before anyone has signed in', () => {
    stubCredentials()

    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Applications' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Members' })).not.toBeInTheDocument()
  })

  it('should name the credential that is missing instead of offering a dead sign-in button', () => {
    stubCredentials({ apiKey: '' })

    render(<App />)

    expect(screen.getByText('VITE_GOOGLE_API_KEY')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument()
  })
})
