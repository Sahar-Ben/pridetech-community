import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApplicantContactLinks } from './ApplicantContactLinks'
import type { Lead } from './lead'

const leadWith = (linkedIn: string): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: undefined,
  company: undefined,
  linkedIn,
  email: 'dana@example.com',
  phone: undefined,
  city: undefined,
  interests: undefined,
  status: 'pending',
})

/* What the browser would actually open: a relative href is resolved against
   the app's own address, which is exactly how these links broke. */
const resolvedHref = (): string =>
  new URL(
    screen.getByRole('link', { name: 'LinkedIn' }).getAttribute('href') ?? '',
    'https://sahar-ben.github.io/pridetech-community/',
  ).href

describe('ApplicantContactLinks, LinkedIn values as people typed them into the form', () => {
  it.each([
    ['linkedin.com/in/dana-maman', 'https://linkedin.com/in/dana-maman'],
    ['www.linkedin.com/in/dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['il.linkedin.com/in/dana-maman/', 'https://il.linkedin.com/in/dana-maman/'],
  ])('should open LinkedIn, not a page of this app, for %s', (cell, expected) => {
    render(<ApplicantContactLinks lead={leadWith(cell)} />)

    expect(resolvedHref()).toBe(expected)
  })

  it('should say the cell needs checking when it holds text but no address', () => {
    render(<ApplicantContactLinks lead={leadWith('I will send it later')} />)

    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument()
    expect(screen.getByText('Check LinkedIn')).toHaveAttribute('title', 'I will send it later')
  })
})
