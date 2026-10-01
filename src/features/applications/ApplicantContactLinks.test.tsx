import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApplicantContactLinks } from './ApplicantContactLinks'
import type { Lead } from './lead'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@saltedmind.co',
  phone: '050-123 4567',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

describe('ApplicantContactLinks', () => {
  it('should open the LinkedIn profile in a new tab', () => {
    render(<ApplicantContactLinks lead={lead()} />)

    const link = screen.getByRole('link', { name: 'LinkedIn' })
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/dana')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should write to the applicant from Email', () => {
    render(<ApplicantContactLinks lead={lead()} />)

    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      'mailto:dana@saltedmind.co',
    )
  })

  it('should dial the number with the spaces and dashes taken out', () => {
    render(<ApplicantContactLinks lead={lead()} />)

    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:0501234567')
  })

  it('should offer no Call button when the applicant left no number', () => {
    render(<ApplicantContactLinks lead={lead({ phone: undefined })} />)

    expect(screen.queryByRole('link', { name: 'Call' })).not.toBeInTheDocument()
  })

  it('should say the profile is missing in its place', () => {
    render(<ApplicantContactLinks lead={lead({ linkedIn: undefined })} />)

    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument()
    expect(screen.getByText('No LinkedIn')).toBeInTheDocument()
  })
})
