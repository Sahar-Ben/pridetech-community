import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LeadsSection } from './LeadsSection'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  createFakeSheetsClient,
  LEADS_HEADER_ROW,
  leadRow,
} from '../../testing/sheetsClientFactory'

const sheetWithTwoPendingLeads = () =>
  createFakeSheetsClient({
    rows: [
      LEADS_HEADER_ROW,
      leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
      leadRow({ name: 'Ariel Cohen', email: 'ariel@example.com' }),
    ],
  })

const clickFirstButton = async (name: RegExp) => {
  const [button] = screen.getAllByRole('button', { name })
  if (button === undefined) {
    throw new Error(`the queue rendered no button matching ${String(name)}`)
  }
  await userEvent.click(button)
}

describe('LeadsSection', () => {
  it('should say the sheet is being read while the rows are on their way', () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent(/reading/i)
  })

  it('should list the applications read from the Leads tab', async () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
    expect(screen.getByText('Ariel Cohen')).toBeInTheDocument()
  })

  it('should warn that decisions are not written to the sheet before anything is clicked', async () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)

    expect(await screen.findByText(/approve and decline are not connected/i)).toBeInTheDocument()
  })

  it('should say plainly that an approval was not written to the sheet', async () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)
    await screen.findByText('Noa Feldman')

    await clickFirstButton(/approve/i)

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Noa Feldman was not written to the Google Sheet/i,
    )
  })

  it('should keep an approved application in the queue, because nothing was decided', async () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)
    await screen.findByText('Noa Feldman')

    await clickFirstButton(/approve/i)

    expect(screen.getByText('Noa Feldman')).toBeInTheDocument()
  })

  it('should say plainly that a decline was not written to the sheet', async () => {
    render(<LeadsSection sheetsClient={sheetWithTwoPendingLeads()} onSessionExpired={vi.fn()} />)
    await screen.findByText('Noa Feldman')

    await clickFirstButton(/decline/i)

    expect(screen.getByRole('alert')).toHaveTextContent(/not written to the Google Sheet/i)
  })

  it('should show what Google said when the sheet cannot be read', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({
          range: 'Leads!A1:Z',
          status: 403,
          detail: 'The caller does not have permission',
        }),
      )

    render(
      <LeadsSection
        sheetsClient={createFakeSheetsClient({ readRange })}
        onSessionExpired={vi.fn()}
      />,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /403.*The caller does not have permission/,
    )
    expect(screen.queryByRole('heading', { name: 'Applications' })).not.toBeInTheDocument()
  })

  it('should read the sheet again when the reviewer retries a failed read', async () => {
    const readRange = vi
      .fn()
      .mockRejectedValueOnce(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 500, detail: 'Backend error' }),
      )
      .mockResolvedValue([
        LEADS_HEADER_ROW,
        leadRow({ name: 'Noa Feldman', email: 'noa@example.com' }),
      ])

    render(
      <LeadsSection
        sheetsClient={createFakeSheetsClient({ readRange })}
        onSessionExpired={vi.fn()}
      />,
    )
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('Noa Feldman')).toBeInTheDocument()
  })

  it('should tell the app to sign in again when the token has expired', async () => {
    const onSessionExpired = vi.fn()
    const readRange = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'Leads!A1:Z', status: 401, detail: 'Invalid Credentials' }),
      )

    render(
      <LeadsSection
        sheetsClient={createFakeSheetsClient({ readRange })}
        onSessionExpired={onSessionExpired}
      />,
    )

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledTimes(1)
    })
  })
})
