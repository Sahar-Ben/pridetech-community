import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SignInScreen } from './SignInScreen'

describe('SignInScreen', () => {
  it('should name the single permission the app asks for', () => {
    render(<SignInScreen errorMessage={undefined} onSignIn={vi.fn()} />)

    expect(screen.getByText(/only the spreadsheet you pick/i)).toBeInTheDocument()
  })

  it('should start sign-in when the button is clicked', async () => {
    const onSignIn = vi.fn()
    render(<SignInScreen errorMessage={undefined} onSignIn={onSignIn} />)

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }))

    expect(onSignIn).toHaveBeenCalledTimes(1)
  })

  it('should show why the last attempt failed', () => {
    render(<SignInScreen errorMessage="The window was closed." onSignIn={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('The window was closed.')
  })

  it('should show no alert before anything has failed', () => {
    render(<SignInScreen errorMessage={undefined} onSignIn={vi.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
