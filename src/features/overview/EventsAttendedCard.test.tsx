import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventsAttendedCard } from './EventsAttendedCard'
import type {
  CommunityEventHistoryResource,
  CommunityEventHistoryState,
} from '../eventHistory/useCommunityEventHistory'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'

const dana = buildMember({ rowNumber: 2, name: 'Dana', mail: 'dana@example.com' })
const tomer = buildMember({ rowNumber: 3, name: 'Tomer', mail: 'tomer@example.com' })
const roni = buildMember({ rowNumber: 4, name: 'Roni', mail: 'roni@example.com' })
const gaya = buildMember({ rowNumber: 5, name: 'Gaya', mail: 'gaya@example.com', status: 'Ex-member' })

const READ: CommunityEventHistoryState = {
  status: 'ready',
  history: {
    events: [buildEvent({ id: 'play', date: '2026-05-01' })],
    registrants: [buildRegistrant({ eventId: 'play', email: 'dana@example.com' })],
    unreadSheets: [],
  },
}

const resourceIn = (state: CommunityEventHistoryState): CommunityEventHistoryResource => ({
  state,
  request: vi.fn(),
  reload: vi.fn(),
})

const renderCard = (state: CommunityEventHistoryState, onOpenMembers = vi.fn()) => {
  const resource = resourceIn(state)
  render(
    <EventsAttendedCard
      members={[dana, tomer, roni, gaya]}
      onOpenMembers={onOpenMembers}
      resource={resource}
    />,
  )
  return { resource, onOpenMembers }
}

const bars = () => within(screen.getByRole('list', { name: /by events attended/i }))

describe('EventsAttendedCard', () => {
  it('should ask for every event to be read as soon as it shows', () => {
    const { resource } = renderCard({ status: 'idle' })

    expect(resource.request).toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/reading every event/i)
  })

  it('should count active members only, by how many events they have been to', () => {
    renderCard(READ)

    expect(bars().getByRole('button', { name: /^No events: 2 members/ })).toBeInTheDocument()
    expect(bars().getByRole('button', { name: /^1 event: 1 members/ })).toBeInTheDocument()
    expect(bars().getByRole('button', { name: /^3\+ events: 0 members/ })).toBeInTheDocument()
  })

  it('should open the members of the band that was tapped', async () => {
    const { onOpenMembers } = renderCard(READ)

    await userEvent.click(bars().getByRole('button', { name: /^No events/ }))

    expect(onOpenMembers).toHaveBeenCalledWith('none')
  })

  it('should offer to read again when the events could not be read', async () => {
    const { resource } = renderCard({ status: 'failed', message: 'The events could not be read.' })

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(resource.reload).toHaveBeenCalled()
  })
})
