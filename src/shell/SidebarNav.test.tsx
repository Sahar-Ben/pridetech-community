import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SidebarNav } from './SidebarNav'

describe('SidebarNav', () => {
  it('should offer the three sections inside a navigation landmark', () => {
    render(<SidebarNav activeSection="leads" onSelectSection={vi.fn()} isOpen={false} />)

    const navigation = screen.getByRole('navigation', { name: /sections/i })
    const sectionNames = within(navigation)
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(sectionNames).toEqual(['Leads', 'Members', 'Events'])
  })

  it('should mark the current section with aria-current', () => {
    render(<SidebarNav activeSection="members" onSelectSection={vi.fn()} isOpen={false} />)

    expect(screen.getByRole('button', { name: 'Members' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Leads' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Events' })).not.toHaveAttribute('aria-current')
  })

  it('should report the chosen section when a nav item is clicked', async () => {
    const onSelectSection = vi.fn()
    render(<SidebarNav activeSection="leads" onSelectSection={onSelectSection} isOpen={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(onSelectSection).toHaveBeenCalledWith('events')
  })
})
