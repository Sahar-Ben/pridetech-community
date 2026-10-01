import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewQueueCard } from './ReviewQueueCard'

describe('ReviewQueueCard', () => {
  it('should say how many applications are waiting', () => {
    render(<ReviewQueueCard onStartReviewing={vi.fn()} waitingCount={255} />)

    expect(screen.getByRole('heading', { name: '255 applications waiting' })).toBeInTheDocument()
  })

  it('should not pluralise a single application', () => {
    render(<ReviewQueueCard onStartReviewing={vi.fn()} waitingCount={1} />)

    expect(screen.getByRole('heading', { name: '1 application waiting' })).toBeInTheDocument()
  })

  it('should open the queue when Start reviewing is pressed', async () => {
    const onStartReviewing = vi.fn()
    render(<ReviewQueueCard onStartReviewing={onStartReviewing} waitingCount={3} />)

    await userEvent.click(screen.getByRole('button', { name: 'Start reviewing' }))

    expect(onStartReviewing).toHaveBeenCalledOnce()
  })

  it('should say the queue is empty rather than invite a review of nothing', () => {
    render(<ReviewQueueCard onStartReviewing={vi.fn()} waitingCount={0} />)

    expect(screen.getByRole('heading', { name: 'No applications waiting' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Leads' })).toBeInTheDocument()
  })
})
