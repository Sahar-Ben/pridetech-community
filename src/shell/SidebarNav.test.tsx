import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SidebarNav } from './SidebarNav'
import type { Section } from './section'
import type { WorkspaceAccount } from './workspaceAccount'

const account = (overrides: Partial<WorkspaceAccount> = {}): WorkspaceAccount => ({
  spreadsheetName: undefined,
  onChangeSpreadsheet: vi.fn(),
  onSignOut: vi.fn(),
  ...overrides,
})

const renderNav = ({
  activeSection = 'overview' as Section,
  onSelectSection = vi.fn(),
  workspaceAccount = account(),
}: {
  activeSection?: Section
  onSelectSection?: (section: Section) => void
  workspaceAccount?: WorkspaceAccount
} = {}) =>
  render(
    <SidebarNav
      account={workspaceAccount}
      activeSection={activeSection}
      isOpen={false}
      onSelectSection={onSelectSection}
    />,
  )

describe('SidebarNav', () => {
  it('should offer every section inside a navigation landmark, Overview first', () => {
    render(<SidebarNav account={account()} activeSection="overview" onSelectSection={vi.fn()} isOpen={false} />)

    const navigation = screen.getByRole('navigation', { name: /sections/i })
    const sectionNames = within(navigation)
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(sectionNames.slice(0, 4)).toEqual(['Overview', 'Leads', 'Members', 'Events'])
  })

  it('should mark the current section with aria-current', () => {
    renderNav({ activeSection: 'members' })

    expect(screen.getByRole('button', { name: 'Members' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Leads' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Events' })).not.toHaveAttribute('aria-current')
  })

  it('should report the chosen section when a nav item is clicked', async () => {
    const onSelectSection = vi.fn()
    renderNav({ activeSection: 'leads', onSelectSection })

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(onSelectSection).toHaveBeenCalledWith('events')
  })
})

describe('SidebarNav, the account actions', () => {
  it('should keep both account actions inside the navigation landmark', () => {
    renderNav()

    const navigation = screen.getByRole('navigation', { name: /sections/i })

    expect(
      within(navigation).getByRole('button', { name: /change spreadsheet/i }),
    ).toBeInTheDocument()
    expect(within(navigation).getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('should put the account actions after every section, so tabbing reaches them last', () => {
    renderNav()

    const navigation = screen.getByRole('navigation', { name: /sections/i })
    const labels = within(navigation)
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(labels.slice(-2)).toEqual([
      expect.stringMatching(/change spreadsheet/i),
      expect.stringMatching(/sign out/i),
    ])
  })

  it('should ask for a different spreadsheet when Change spreadsheet is clicked', async () => {
    const onChangeSpreadsheet = vi.fn()
    renderNav({ workspaceAccount: account({ onChangeSpreadsheet }) })

    await userEvent.click(screen.getByRole('button', { name: /change spreadsheet/i }))

    expect(onChangeSpreadsheet).toHaveBeenCalledOnce()
  })

  it('should sign out when Sign out is clicked', async () => {
    const onSignOut = vi.fn()
    renderNav({ workspaceAccount: account({ onSignOut }) })

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('should name the spreadsheet being written to, so a test copy is noticed', () => {
    renderNav({ workspaceAccount: account({ spreadsheetName: 'PrideTech WRITE TEST' }) })

    expect(screen.getByText('PrideTech WRITE TEST')).toBeInTheDocument()
  })

  it('should say nothing about the spreadsheet rather than invent a label when the name is unknown', () => {
    renderNav()

    expect(screen.getByRole('button', { name: 'Change spreadsheet' })).toBeInTheDocument()
  })
})
