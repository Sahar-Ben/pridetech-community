import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsQueue } from './ApplicationsQueue'
import type { Lead } from './lead'
import type { LeadDecisions } from './useLeadDecisions'
import { buildLeadsReviewFixture } from '../../testing/leadsReviewFactory'

const lead = (overrides: Partial<Lead>): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const decisions: LeadDecisions = {
  decidedRowNumbers: new Set(),
  stateFor: () => ({ isSaving: false, errorMessage: undefined }),
  approve: vi.fn(),
  decline: vi.fn(),
  markMaybe: vi.fn(),
  forgetDecisions: vi.fn(),
}

const LEADS = [
  lead({
    rowNumber: 2,
    name: 'Maya Rosen',
    email: 'maya@example.com',
    company: 'Kite',
    city: 'Haifa',
  }),
  lead({
    rowNumber: 3,
    name: 'Avi Cohen',
    email: 'avi@example.com',
    company: 'Orbit',
    linkedIn: undefined,
  }),
  lead({
    rowNumber: 4,
    name: 'Noa Levi',
    email: 'noa@example.com',
    company: 'Lumen',
    interests: 'Cloud',
  }),
]

const renderQueue = () =>
  render(
    <ApplicationsQueue
      decisions={decisions}
      onReload={vi.fn()}
      review={buildLeadsReviewFixture({ leads: LEADS, memberRows: [], rowsWithoutEmail: [] })}
      spreadsheetId="sheet"
    />,
  )

const shownNames = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

const openSheet = async () => {
  await userEvent.click(screen.getByRole('button', { name: /sort & filter/i }))
  return screen.getByRole('dialog', { name: 'Sort & filter' })
}

describe('ApplicationsQueue, search', () => {
  it('should narrow the cards as the reviewer types', async () => {
    renderQueue()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'orbit')

    expect(shownNames()).toEqual(['Avi Cohen'])
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 3')
  })

  it('should say nothing matched and offer to clear, rather than show an empty queue', async () => {
    renderQueue()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'zzz')

    expect(
      screen.getByText('No applications match this search and these filters.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear all' })[0] as HTMLElement)
    expect(shownNames()).toHaveLength(3)
  })
})

describe('ApplicationsQueue, the sort and filter sheet', () => {
  it('should open as a dialog and close on Escape, handing focus back', async () => {
    renderQueue()

    const sheet = await openSheet()
    expect(sheet).toHaveFocus()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sort & filter/i })).toHaveFocus()
  })

  it('should sort by name', async () => {
    renderQueue()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Name A–Z' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /show 3 applications/i }))

    expect(shownNames()).toEqual(['Avi Cohen', 'Maya Rosen', 'Noa Levi'])
  })

  it('should filter by city and say how many will be shown', async () => {
    renderQueue()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /haifa/i }))

    expect(within(sheet).getByRole('button', { name: 'Show 1 application' })).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Show 1 application' }))
    expect(shownNames()).toEqual(['Maya Rosen'])
  })

  it('should filter to applicants with no LinkedIn profile', async () => {
    renderQueue()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('radio', { name: 'No LinkedIn' }))
    await userEvent.keyboard('{Escape}')

    expect(shownNames()).toEqual(['Avi Cohen'])
  })

  it('should show what is in force as chips that each remove themselves', async () => {
    renderQueue()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^cloud/i }))
    await userEvent.keyboard('{Escape}')

    expect(shownNames()).toEqual(['Noa Levi'])
    expect(screen.getByRole('button', { name: /sort & filter.*1 active/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remove Cloud' }))

    expect(shownNames()).toHaveLength(3)
  })
})
