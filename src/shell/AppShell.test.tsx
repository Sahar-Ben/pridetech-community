import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import type { WorkspaceAccount } from './workspaceAccount'

const account = (overrides: Partial<WorkspaceAccount> = {}): WorkspaceAccount => ({
  spreadsheetName: undefined,
  onChangeSpreadsheet: vi.fn(),
  onSignOut: vi.fn(),
  ...overrides,
})

const renderShell = ({
  workspaceAccount = account(),
  onSelectSection = vi.fn(),
}: { workspaceAccount?: WorkspaceAccount; onSelectSection?: () => void } = {}) =>
  render(
    <AppShell account={workspaceAccount} activeSection="leads" onSelectSection={onSelectSection}>
      <p>Section content</p>
    </AppShell>,
  )

const accountButton = () => screen.getByRole('button', { name: 'Account' })

describe('AppShell', () => {
  it('should render the section content it is given', () => {
    renderShell()

    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('should name the workspace in its one top-level heading', () => {
    renderShell()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/PrideTech/)
  })

  it('should offer every section without opening anything first', () => {
    renderShell()

    expect(screen.getByRole('button', { name: 'Members' })).toBeVisible()
  })

  it('should report the section chosen in the nav', async () => {
    const onSelectSection = vi.fn()
    renderShell({ onSelectSection })

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(onSelectSection).toHaveBeenCalledWith('events')
  })
})

describe('AppShell, the account menu', () => {
  it('should keep the account menu closed until it is asked for', () => {
    renderShell()

    expect(accountButton()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('should open the menu and move focus into it', async () => {
    renderShell()

    await userEvent.click(accountButton())

    expect(accountButton()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Account' })).toHaveFocus()
  })

  it('should close on Escape and hand focus back to the Account button', async () => {
    renderShell()

    await userEvent.click(accountButton())
    await userEvent.keyboard('{Escape}')

    expect(accountButton()).toHaveAttribute('aria-expanded', 'false')
    expect(accountButton()).toHaveFocus()
  })

  it('should close when something outside it is pressed', async () => {
    renderShell()

    await userEvent.click(accountButton())
    await userEvent.click(screen.getByText('Section content'))

    expect(accountButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('should sign out from the menu', async () => {
    const onSignOut = vi.fn()
    renderShell({ workspaceAccount: account({ onSignOut }) })

    await userEvent.click(accountButton())
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('should ask for a different spreadsheet from the menu', async () => {
    const onChangeSpreadsheet = vi.fn()
    renderShell({ workspaceAccount: account({ onChangeSpreadsheet }) })

    await userEvent.click(accountButton())
    await userEvent.click(screen.getByRole('button', { name: 'Change spreadsheet' }))

    expect(onChangeSpreadsheet).toHaveBeenCalledOnce()
  })

  it('should put Sign out after Change spreadsheet, so tabbing reaches it last', async () => {
    renderShell()

    await userEvent.click(accountButton())
    const labels = screen
      .getAllByRole('button')
      .map((button) => button.textContent)
      .filter((label) => /change spreadsheet|sign out/i.test(label ?? ''))

    expect(labels).toEqual([
      expect.stringMatching(/change spreadsheet/i),
      expect.stringMatching(/sign out/i),
    ])
  })

  it('should name the spreadsheet being written to, so a test copy is noticed', async () => {
    renderShell({ workspaceAccount: account({ spreadsheetName: 'PrideTech WRITE TEST' }) })

    await userEvent.click(accountButton())

    expect(screen.getByText('PrideTech WRITE TEST')).toBeInTheDocument()
  })

  it('should say nothing about the spreadsheet rather than invent a label when the name is unknown', async () => {
    renderShell()

    await userEvent.click(accountButton())

    expect(screen.getByRole('button', { name: 'Change spreadsheet' })).toBeInTheDocument()
  })
})
