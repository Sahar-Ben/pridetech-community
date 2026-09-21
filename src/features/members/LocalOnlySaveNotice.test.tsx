import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocalOnlySaveNotice } from './LocalOnlySaveNotice'

describe('LocalOnlySaveNotice', () => {
  it('should say the edit was kept in this browser and not in the sheet', () => {
    render(<LocalOnlySaveNotice />)

    expect(screen.getByText(/saved in this browser only/i)).toBeInTheDocument()
    expect(screen.getByText(/has not been written to the Google Sheet/i)).toBeInTheDocument()
  })

  it('should warn that reloading loses the edit', () => {
    render(<LocalOnlySaveNotice />)

    expect(screen.getByText(/lost when you reload/i)).toBeInTheDocument()
  })

  it('should not claim the app never writes to the sheet, because approving an application does', () => {
    render(<LocalOnlySaveNotice />)

    expect(screen.queryByText(/nothing in this app writes to the sheet/i)).not.toBeInTheDocument()
  })
})
