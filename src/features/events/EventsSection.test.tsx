import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'
import { EventsSection } from './EventsSection'
import type { CommunityEvent } from './communityEvent'
import type { Registrant } from './registrant'

const TODAY = '2026-09-19'

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })

const renderEvents = ({
  events,
  registrants = [],
}: {
  events: readonly CommunityEvent[]
  registrants?: readonly Registrant[]
}) =>
  render(<EventsSection events={events} members={[dana]} registrants={registrants} today={TODAY} />)

const eventNamesIn = (groupName: RegExp): readonly (string | null)[] =>
  within(screen.getByRole('region', { name: groupName }))
    .getAllByRole('heading', { level: 4 })
    .map((heading) => heading.textContent)

describe('EventsSection listing', () => {
  const everyEvent = [
    buildEvent({ id: 'd', name: 'Opening Meetup', date: '2025-05-14' }),
    buildEvent({ id: 'b', name: 'Winter Social', date: '2026-12-02' }),
    buildEvent({ id: 'c', name: 'Pride Panel', date: '2026-06-24' }),
    buildEvent({ id: 'a', name: 'Autumn Mixer', date: '2026-09-24' }),
  ]

  it('should list upcoming events soonest first', () => {
    renderEvents({ events: everyEvent })

    expect(eventNamesIn(/upcoming/i)).toEqual(['Autumn Mixer', 'Winter Social'])
  })

  it('should list past events most recent first', () => {
    renderEvents({ events: everyEvent })

    expect(eventNamesIn(/past/i)).toEqual(['Pride Panel', 'Opening Meetup'])
  })

  it('should show the date and location of each event', () => {
    renderEvents({
      events: [
        buildEvent({ date: '2026-09-24', host: 'Fennimore Labs', location: 'Wharf 6, Tel Aviv' }),
      ],
    })

    expect(screen.getByText(/24 Sep 2026/)).toHaveTextContent('Wharf 6, Tel Aviv')
  })

  it('should name the company hosting an event', () => {
    renderEvents({ events: [buildEvent({ host: 'Fennimore Labs' })] })

    expect(screen.getByText(/hosted by fennimore labs/i)).toBeInTheDocument()
  })

  it('should say nothing about a host for an event no company hosts', () => {
    renderEvents({ events: [buildEvent({ host: undefined })] })

    expect(screen.queryByText(/hosted by/i)).not.toBeInTheDocument()
  })

  it('should show how many people have registered for an event', () => {
    renderEvents({
      events: [buildEvent({ id: 'a' })],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a' }),
        buildRegistrant({ id: 'r2', eventId: 'a' }),
        buildRegistrant({ id: 'r3', eventId: 'a', registration: 'waitlist' }),
      ],
    })

    expect(screen.getByText(/2 registered/)).toHaveTextContent('1 on the waitlist')
  })

  it('should tell the organiser when there are no events at all', () => {
    renderEvents({ events: [] })

    expect(screen.getByText(/no events yet/i)).toBeInTheDocument()
  })
})

describe('EventsSection archiving', () => {
  it('should take an archived event out of the listing', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Winter Mixer', date: '2026-12-02' })] })

    await userEvent.click(screen.getByRole('button', { name: 'Archive Winter Mixer' }))

    expect(screen.queryByRole('heading', { name: 'Winter Mixer' })).not.toBeInTheDocument()
  })

  it('should say the attendance was kept, since archiving is not deleting', async () => {
    renderEvents({
      events: [buildEvent({ id: 'a', name: 'Winter Mixer' })],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a' })],
    })

    await userEvent.click(screen.getByRole('button', { name: 'Archive Winter Mixer' }))

    expect(screen.getByText(/attendance is kept/i)).toBeInTheDocument()
  })

  it('should warn that archiving stayed in this browser', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Winter Mixer' })] })

    await userEvent.click(screen.getByRole('button', { name: 'Archive Winter Mixer' }))

    expect(screen.getByText(/saved in this browser only/i)).toBeInTheDocument()
  })
})

describe('EventsSection adding and editing', () => {
  it('should add an event to the listing', async () => {
    renderEvents({ events: [] })

    await userEvent.click(screen.getByRole('button', { name: /add event/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Board Games Night')
    await userEvent.type(screen.getByLabelText(/^date/i), '2026-10-15')
    await userEvent.type(screen.getByLabelText(/^location/i), 'Pell and Quarry, Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    expect(screen.getByRole('heading', { name: 'Board Games Night' })).toBeInTheDocument()
  })

  it('should refuse an event with no date rather than filing it under the wrong list', async () => {
    renderEvents({ events: [] })

    await userEvent.click(screen.getByRole('button', { name: /add event/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Board Games Night')
    await userEvent.type(screen.getByLabelText(/^location/i), 'Pell and Quarry, Haifa')
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    expect(screen.getByText(/an event needs a date/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Board Games Night' })).not.toBeInTheDocument()
  })

  it('should rename an event that was edited', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Autumn Mixer', date: '2026-09-24' })] })

    await userEvent.click(screen.getByRole('button', { name: 'Edit Autumn Mixer' }))
    await userEvent.clear(screen.getByLabelText(/^name/i))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Autumn Hiring Mixer')
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    expect(screen.getByRole('heading', { name: 'Autumn Hiring Mixer' })).toBeInTheDocument()
  })

  it('should warn that an edit stayed in this browser', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Autumn Mixer', date: '2026-09-24' })] })

    await userEvent.click(screen.getByRole('button', { name: 'Edit Autumn Mixer' }))
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))

    expect(screen.getByText(/saved in this browser only/i)).toBeInTheDocument()
  })
})

describe('EventsSection door policy', () => {
  it('should start a new event members only, since almost every event is', async () => {
    renderEvents({ events: [] })

    await userEvent.click(screen.getByRole('button', { name: /add event/i }))

    expect(screen.getByLabelText(/members only/i)).toBeChecked()
  })

  it('should let the organiser open an evening to non-members', async () => {
    renderEvents({ events: [] })

    await userEvent.click(screen.getByRole('button', { name: /add event/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Singles Night')
    await userEvent.type(screen.getByLabelText(/^date/i), '2026-10-15')
    await userEvent.type(screen.getByLabelText(/^location/i), 'The Copper Room, Tel Aviv')
    await userEvent.click(screen.getByLabelText(/members only/i))
    await userEvent.click(screen.getByRole('button', { name: /^save event$/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Singles Night' }))

    expect(screen.getByText(/open to non-members/i)).toBeInTheDocument()
  })

  it('should open the edit form on the policy the event already has', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Autumn Mixer', isMembersOnly: true })] })

    await userEvent.click(screen.getByRole('button', { name: 'Edit Autumn Mixer' }))

    expect(screen.getByLabelText(/members only/i)).toBeChecked()
  })

  it('should say on the event page that an event is members only', async () => {
    renderEvents({ events: [buildEvent({ id: 'a', name: 'Autumn Mixer', isMembersOnly: true })] })

    await userEvent.click(screen.getByRole('button', { name: 'Autumn Mixer' }))

    expect(screen.getByText(/members only/i)).toBeInTheDocument()
  })
})

describe('EventsSection event detail', () => {
  const pridePanel = buildEvent({ id: 'a', name: 'Pride Panel', date: '2026-06-24' })

  const openPridePanel = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pride Panel' }))
  }

  it('should list the registrants of the event that was opened', async () => {
    renderEvents({
      events: [pridePanel, buildEvent({ id: 'b', name: 'Other', date: '2026-06-01' })],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a', name: 'Ronit Amsalem' }),
        buildRegistrant({ id: 'r2', eventId: 'b', name: 'Somebody Else' }),
      ],
    })

    await openPridePanel()

    const registrants = within(screen.getByRole('table', { name: /registrants/i }))
    expect(registrants.getByText('Ronit Amsalem')).toBeInTheDocument()
    expect(registrants.queryByText('Somebody Else')).not.toBeInTheDocument()
  })

  it('should show the email, company and status of a registrant', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [
        buildRegistrant({
          id: 'r1',
          eventId: 'a',
          name: 'Ronit Amsalem',
          email: 'ronit.amsalem@example.com',
          company: 'Halberd Analytics',
        }),
      ],
    })

    await openPridePanel()

    expect(screen.getByText('ronit.amsalem@example.com')).toBeInTheDocument()
    expect(screen.getByText('Halberd Analytics')).toBeInTheDocument()
    expect(screen.getByText('Registered')).toBeInTheDocument()
  })

  it('should summarise registered, checked in and waitlist', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a', checkedInAt: '2026-06-24T18:00:00.000Z' }),
        buildRegistrant({ id: 'r2', eventId: 'a' }),
        buildRegistrant({ id: 'r3', eventId: 'a', registration: 'waitlist' }),
      ],
    })

    await openPridePanel()

    const summary = screen.getByText(/2 registered/)
    expect(summary).toHaveTextContent('1 checked in')
    expect(summary).toHaveTextContent('1 on the waitlist')
  })

  it('should call nobody a no-show while the event has not been closed out', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', name: 'Ronit Amsalem' })],
    })

    await openPridePanel()

    expect(screen.queryByText(/no-show/i)).not.toBeInTheDocument()
  })

  it('should report no-shows once the event has been closed out', async () => {
    renderEvents({
      events: [buildEvent({ id: 'a', name: 'Pride Panel', date: '2026-06-24', isClosedOut: true })],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a', checkedInAt: '2026-06-24T18:00:00.000Z' }),
        buildRegistrant({ id: 'r2', eventId: 'a' }),
      ],
    })

    await openPridePanel()

    expect(screen.getByText('No-show')).toBeInTheDocument()
    expect(screen.getByText(/2 registered/)).toHaveTextContent('1 no-show')
  })

  it('should turn un-arrived registrants into no-shows only when the organiser closes the event out', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', name: 'Ronit Amsalem' })],
    })

    await openPridePanel()
    await userEvent.click(screen.getByRole('button', { name: /close out attendance/i }))

    expect(screen.getByText('No-show')).toBeInTheDocument()
  })

  it('should show a registrant whose sheet never captured an email without falling over', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a', name: 'Tal Rimon', email: undefined }),
      ],
    })

    await openPridePanel()

    expect(screen.getByText('Tal Rimon')).toBeInTheDocument()
    expect(screen.getByText(/no email on this sheet/i)).toBeInTheDocument()
  })

  it('should not claim a member match for a registrant with no email', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [
        buildRegistrant({ id: 'r1', eventId: 'a', name: 'Dana Sorkin', email: undefined }),
      ],
    })

    await openPridePanel()

    expect(screen.queryByText('Member')).not.toBeInTheDocument()
  })

  it('should mark a registrant who is a community member', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', email: 'dana.sorkin@example.com' })],
    })

    await openPridePanel()

    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('should show a plus-one as the guest of the member who brought them', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [
        buildRegistrant({
          id: 'r1',
          eventId: 'a',
          name: 'Dana Sorkin',
          email: 'dana.sorkin@example.com',
        }),
        buildRegistrant({
          id: 'r2',
          eventId: 'a',
          name: 'Shira Bental',
          email: 'shira.bental@example.com',
          guestOfEmail: 'dana.sorkin@example.com',
        }),
      ],
    })

    await openPridePanel()

    expect(screen.getByText('Guest of Dana Sorkin')).toBeInTheDocument()
    expect(screen.queryByText('Not matched to a member')).not.toBeInTheDocument()
  })

  it('should say plainly that an unmatched registrant is unmatched', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', email: 'stranger@example.com' })],
    })

    await openPridePanel()

    expect(screen.getByText('Not matched to a member')).toBeInTheDocument()
  })

  it('should say the reconcile flow is not built rather than offering a broken one', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', email: 'stranger@example.com' })],
    })

    await openPridePanel()

    expect(screen.getByText(/not built yet/i)).toBeInTheDocument()
  })

  it('should say the attendance shown was never recorded anywhere', async () => {
    renderEvents({
      events: [pridePanel],
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', checkedInAt: '2026-06-24T18:00:00.000Z' })],
    })

    await openPridePanel()

    expect(screen.getByText(/never been recorded anywhere/i)).toBeInTheDocument()
  })

  it('should go back to the listing', async () => {
    renderEvents({ events: [pridePanel] })

    await openPridePanel()
    await userEvent.click(screen.getByRole('button', { name: /back to events/i }))

    expect(screen.getByRole('region', { name: /past/i })).toBeInTheDocument()
  })
})
