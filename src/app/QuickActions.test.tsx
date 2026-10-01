import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuickActions } from './QuickActions'

const ALL = ['linkedin', 'whatsapp', 'call', 'email'] as const

describe('QuickActions', () => {
  it('should turn every cell into a working link', () => {
    render(
      <QuickActions
        actions={ALL}
        email="dana@example.com"
        linkedIn="www.linkedin.com/in/dana"
        phone="052-265-3289"
      />,
    )

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/dana',
    )
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/972522653289',
    )
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+972522653289')
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      'mailto:dana@example.com',
    )
  })

  it('should keep a quiet place for what is missing rather than a broken link', () => {
    render(<QuickActions actions={ALL} email={undefined} linkedIn={undefined} phone={undefined} />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText('No LinkedIn')).toBeInTheDocument()
    expect(screen.getAllByText('No phone')).toHaveLength(2)
    expect(screen.getByText('No email')).toBeInTheDocument()
  })

  it('should say a LinkedIn cell needs checking when it holds no address', () => {
    render(
      <QuickActions actions={['linkedin']} email={undefined} linkedIn="will send later" phone={undefined} />,
    )

    expect(screen.getByText('Check LinkedIn')).toHaveAttribute('title', 'will send later')
  })

  it('should show only the actions it is asked for', () => {
    render(
      <QuickActions
        actions={['linkedin', 'email', 'whatsapp']}
        email="dana@example.com"
        linkedIn="https://www.linkedin.com/in/dana"
        phone="0522653289"
      />,
    )

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'LinkedIn',
      'Email',
      'WhatsApp',
    ])
  })
})
