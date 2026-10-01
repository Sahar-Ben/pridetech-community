import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SectionNav } from './SectionNav'

describe('SectionNav', () => {
  it('should offer every section inside a navigation landmark, Overview first', () => {
    render(<SectionNav activeSection="overview" onSelectSection={vi.fn()} />)

    const navigation = screen.getByRole('navigation', { name: /sections/i })
    const sectionNames = within(navigation)
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(sectionNames).toEqual(['Overview', 'Leads', 'Members', 'Events'])
  })

  it('should mark the current section with aria-current', () => {
    render(<SectionNav activeSection="members" onSelectSection={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Members' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Leads' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Events' })).not.toHaveAttribute('aria-current')
  })

  it('should report the chosen section when a nav item is clicked', async () => {
    const onSelectSection = vi.fn()
    render(<SectionNav activeSection="leads" onSelectSection={onSelectSection} />)

    await userEvent.click(screen.getByRole('button', { name: 'Events' }))

    expect(onSelectSection).toHaveBeenCalledWith('events')
  })
})
