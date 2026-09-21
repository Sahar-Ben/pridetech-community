import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsQueue } from './ApplicationsQueue'
import type { Lead } from './lead'

const pendingLead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2, name: 'Dana Maman', jobTitle: 'Founder', company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana', email: 'dana@saltedmind.co',
  phone: '050', city: 'Tel Aviv', interests: 'AI', status: 'pending', ...overrides,
})

describe('ApplicationsQueue', () => {
  it('should show each pending applicant with their title and company', () => {
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByText('Dana Maman')).toBeInTheDocument()
    expect(screen.getByText(/Founder/)).toBeInTheDocument()
    expect(screen.getByText(/Salted Mind/)).toBeInTheDocument()
  })

  it('should link to the applicant LinkedIn profile, since gender is decided from it', () => {
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href', 'https://linkedin.com/in/dana',
    )
  })

  it('should hide applications that have already been decided', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead(), pendingLead({ name: 'Old', status: 'approved' })]}
        onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.queryByText('Old')).not.toBeInTheDocument()
  })

  it('should show oldest applications first, since they have waited longest', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ rowNumber: 9, name: 'Newer' }), pendingLead({ rowNumber: 2, name: 'Older' })]}
        onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    const names = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)
    expect(names).toEqual(['Older', 'Newer'])
  })

  it('should approve with the gender chosen by the reviewer', async () => {
    const onApprove = vi.fn()
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={onApprove} onDecline={vi.fn()} />)

    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'F')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({ lead: expect.objectContaining({ name: 'Dana Maman' }), gender: 'F' })
  })

  it('should default gender to unknown so nobody is approved with a guessed value', async () => {
    const onApprove = vi.fn()
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={onApprove} onDecline={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ gender: 'unknown' }))
  })

  it('should tell the reviewer when the queue is empty', () => {
    render(<ApplicationsQueue leads={[]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByText(/no applications waiting/i)).toBeInTheDocument()
  })

  it('should decline with the applicant, so the reviewer can reject without choosing a gender', async () => {
    const onDecline = vi.fn()
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={vi.fn()} onDecline={onDecline} />)

    await userEvent.click(screen.getByRole('button', { name: /decline/i }))

    expect(onDecline).toHaveBeenCalledWith({ lead: expect.objectContaining({ name: 'Dana Maman' }) })
  })

  it('should identify a nameless applicant by their email instead of an empty heading', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ name: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('dana@saltedmind.co')
  })

  it('should not repeat the email in the contact line when it already names the applicant', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ name: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.getAllByText(/dana@saltedmind\.co/)).toHaveLength(1)
  })

  it('should omit the profile link when the applicant left LinkedIn blank', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ linkedIn: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.queryByRole('link', { name: /linkedin/i })).not.toBeInTheDocument()
  })

  it('should tell the reviewer the profile is missing, since they cannot decide without one', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ linkedIn: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.getByText(/no linkedin/i)).toBeInTheDocument()
  })

  it('should show the job title alone when the applicant left the company blank', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ company: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.getByText('Founder')).toBeInTheDocument()
  })

  it('should show the company alone when the applicant left the job title blank', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ jobTitle: undefined })]} onApprove={vi.fn()} onDecline={vi.fn()} />,
    )
    expect(screen.getByText('Salted Mind')).toBeInTheDocument()
  })

  it('should still offer a decision when every optional field is blank', async () => {
    const onApprove = vi.fn()
    render(
      <ApplicationsQueue
        leads={[
          pendingLead({
            name: undefined, jobTitle: undefined, company: undefined,
            linkedIn: undefined, phone: undefined, city: undefined, interests: undefined,
          }),
        ]}
        onApprove={onApprove} onDecline={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({
      lead: expect.objectContaining({ email: 'dana@saltedmind.co' }), gender: 'unknown',
    })
  })
})
