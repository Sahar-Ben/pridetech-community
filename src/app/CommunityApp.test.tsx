import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommunityApp } from './CommunityApp'
import { createFakeDeviceLock, type FakeDeviceLock } from '../testing/deviceLockFactory'
import type { CreateSheetsClient } from '../sheets/sheetsClient'
import { SheetsRequestError } from '../sheets/sheetsRequestError'
import {
  createFakeGoogleTokenPort,
  createFakeSpreadsheetPicker,
} from '../testing/googlePortFactory'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
} from '../testing/sheetsClientFactory'

const PENDING_ROWS = [LEADS_HEADER_ROW, leadRow({ name: 'Noa Feldman', email: 'noa@example.com' })]

const createClientFor = (rows: readonly string[][]): CreateSheetsClient => {
  const sheetsClient = createFakeSheetsClient({ rows })
  return () => sheetsClient
}

const renderCommunityApp = ({
  spreadsheetIds = ['spreadsheet-1'],
  createClient = createClientFor(PENDING_ROWS),
  deviceLock = createFakeDeviceLock(),
}: {
  spreadsheetIds?: readonly string[]
  createClient?: CreateSheetsClient
  deviceLock?: FakeDeviceLock
} = {}) => {
  const google = createFakeGoogleTokenPort()
  render(
    <CommunityApp
      createAccessTokenRequester={google.createAccessTokenRequester}
      pickSpreadsheet={createFakeSpreadsheetPicker(spreadsheetIds)}
      createClient={createClient}
      deviceLock={deviceLock}
    />,
  )
  return google
}

const signIn = async (google: ReturnType<typeof createFakeGoogleTokenPort>) => {
  await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }))
  act(() => {
    google.grantToken('token-1')
  })
}

afterEach(() => {
  window.localStorage.clear()
})

describe('CommunityApp', () => {
  it('should ask the reviewer to sign in before anything else', () => {
    renderCommunityApp()

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('should show nobody from the spreadsheet while signed out', () => {
    renderCommunityApp()

    expect(screen.queryByText('Noa Feldman')).not.toBeInTheDocument()
  })

  it('should ask for a spreadsheet once signed in with none chosen', async () => {
    const google = renderCommunityApp()

    await signIn(google)

    expect(screen.getByRole('button', { name: /choose spreadsheet/i })).toBeInTheDocument()
  })

  it('should show the applications once a spreadsheet has been picked', async () => {
    const google = renderCommunityApp()
    await signIn(google)

    await userEvent.click(screen.getByRole('button', { name: /choose spreadsheet/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Leads' }))

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
  })

  it('should go straight to the workspace when a spreadsheet was chosen in an earlier session', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const google = renderCommunityApp()

    await signIn(google)

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })

  it('should say why sign-in failed instead of leaving a dead button', async () => {
    const google = renderCommunityApp()

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }))
    act(() => {
      google.refuseToken('The Google sign-in window was closed before it finished.')
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/closed before it finished/i)
  })

  it('should send the reviewer back to sign-in with an explanation when the token has expired', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 401, detail: 'Invalid Credentials' }),
      )
    const expiredClient = createFakeSheetsClient({ readRange })
    const google = renderCommunityApp({ createClient: () => expiredClient })

    await signIn(google)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/session expired/i)
    })
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('should not retry a read in a loop once the session has expired, on either tab', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 401, detail: 'Invalid Credentials' }),
      )
    const expiredClient = createFakeSheetsClient({ readRange })
    const google = renderCommunityApp({ createClient: () => expiredClient })

    await signIn(google)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/session expired/i)
    })

    const rangesRead = readRange.mock.calls.map(([options]) =>
      String((options as { range: string }).range),
    )
    expect(rangesRead).toEqual(['Members!A1:Z', 'Leads!A1:Z'])
  })

  it('should return to the sign-in screen when the reviewer signs out', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const google = renderCommunityApp()
    await signIn(google)
    await screen.findByRole('heading', { name: 'Overview' })

    await userEvent.click(screen.getByRole('button', { name: 'Account' }))

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('should ask for Face ID before sign-in when the lock was set up earlier', async () => {
    window.localStorage.setItem('pridetech.lockCredentialId', 'passkey-1')
    renderCommunityApp({ deviceLock: createFakeDeviceLock({ available: true }) })

    expect(screen.getByRole('heading', { name: 'The app is locked' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Unlock with Face ID' }))

    expect(
      await screen.findByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument()
  })

  it('should keep the workspace where it was behind a lock after five minutes away', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const google = renderCommunityApp({ deviceLock: createFakeDeviceLock({ available: true }) })
    await signIn(google)
    await screen.findByRole('heading', { name: 'Overview' })
    await userEvent.click(screen.getByRole('button', { name: 'Account' }))
    await userEvent.click(screen.getByRole('button', { name: /turn on face id lock/i }))
    await screen.findByRole('button', { name: /turn off face id lock/i })

    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(0)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    now.mockReturnValue(5 * 60 * 1000)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    now.mockRestore()

    expect(screen.getByRole('heading', { name: 'The app is locked' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Unlock with Face ID' }))

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(google.requestAccessToken).toHaveBeenCalledTimes(1)
  })

  it('should let the reviewer swap to a different spreadsheet from the workspace', async () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    const createClient = vi.fn(() => createFakeSheetsClient({ rows: PENDING_ROWS }))
    const google = renderCommunityApp({
      spreadsheetIds: ['second-sheet'],
      createClient,
    })
    await signIn(google)
    await screen.findByRole('heading', { name: 'Overview' })

    await userEvent.click(screen.getByRole('button', { name: 'Account' }))

    await userEvent.click(screen.getByRole('button', { name: /change spreadsheet/i }))

    await waitFor(() => {
      expect(window.localStorage.getItem('pridetech.spreadsheetId')).toBe('second-sheet')
    })
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ spreadsheetId: 'second-sheet' }),
    )
  })

  it('should say that nothing changed when the picker is closed without a choice', async () => {
    const google = renderCommunityApp({ spreadsheetIds: [] })
    await signIn(google)

    await userEvent.click(screen.getByRole('button', { name: /choose spreadsheet/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/no spreadsheet was chosen/i)
  })
})
