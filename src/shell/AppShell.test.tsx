import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const renderShell = () =>
  render(
    <AppShell activeSection="leads" onSelectSection={vi.fn()}>
      <p>Section content</p>
    </AppShell>,
  )

const burger = () => screen.getByRole('button', { name: 'Menu' })

describe('AppShell', () => {
  it('should render the section content it is given', () => {
    renderShell()

    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('should keep the drawer closed until the burger is pressed', () => {
    renderShell()

    expect(burger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should open the drawer when the burger is clicked', async () => {
    renderShell()

    await userEvent.click(burger())

    expect(burger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('should move focus into the drawer when it opens', async () => {
    renderShell()

    await userEvent.click(burger())

    expect(screen.getByRole('navigation', { name: /sections/i })).toHaveFocus()
  })

  it('should close the drawer after choosing a section', async () => {
    renderShell()

    await userEvent.click(burger())
    await userEvent.click(screen.getByRole('button', { name: 'Members' }))

    expect(burger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should close the drawer on Escape', async () => {
    renderShell()

    await userEvent.click(burger())
    await userEvent.keyboard('{Escape}')

    expect(burger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should close the drawer when the area outside it is tapped', async () => {
    renderShell()

    await userEvent.click(burger())
    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(burger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should return focus to the burger when the drawer closes', async () => {
    renderShell()

    await userEvent.click(burger())
    await userEvent.keyboard('{Escape}')

    expect(burger()).toHaveFocus()
  })

  it('should offer no way to dismiss the drawer while it is closed', () => {
    renderShell()

    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })
})
