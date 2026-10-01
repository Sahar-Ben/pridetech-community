import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CopyButton } from './CopyButton'

describe('CopyButton', () => {
  it('should put the value on the clipboard and say it did', async () => {
    const user = userEvent.setup()
    render(<CopyButton label="email" text="dana@example.com" />)

    await user.click(screen.getByRole('button', { name: 'Copy email' }))

    expect(await navigator.clipboard.readText()).toBe('dana@example.com')
    await waitFor(() => {
      expect(screen.getByText('Copied email')).toBeInTheDocument()
    })
  })
})
