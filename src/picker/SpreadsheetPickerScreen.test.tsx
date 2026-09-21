import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SpreadsheetPickerScreen } from './SpreadsheetPickerScreen'

describe('SpreadsheetPickerScreen', () => {
  it('should name the spreadsheet the reviewer is looking for', () => {
    render(<SpreadsheetPickerScreen message={undefined} onChoose={vi.fn()} />)

    expect(screen.getByText(/PrideTech Dashboard/)).toBeInTheDocument()
  })

  it('should open the picker when the button is clicked', async () => {
    const onChoose = vi.fn()
    render(<SpreadsheetPickerScreen message={undefined} onChoose={onChoose} />)

    await userEvent.click(screen.getByRole('button', { name: /choose spreadsheet/i }))

    expect(onChoose).toHaveBeenCalledTimes(1)
  })

  it('should show why the last attempt produced no spreadsheet', () => {
    render(<SpreadsheetPickerScreen message="No spreadsheet was chosen." onChoose={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('No spreadsheet was chosen.')
  })
})
