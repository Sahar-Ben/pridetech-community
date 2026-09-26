import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import {
  buildRegistrantLoads,
  createFakeAttendanceStore,
  createFakeEventRegistryWriter,
  createFakeResponseSheetAccess,
} from '../../testing/eventsRegistryFactory'
import { buildMember } from '../../testing/memberFactory'
import { EventsWorkspace } from './EventsWorkspace'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const TODAY = '2026-09-19'

const autumnMixer = buildEvent({ id: 'a', name: 'Autumn Mixer', date: '2026-09-24' })

const membersOnlyMixer = buildEvent({
  id: 'a',
  name: 'Autumn Mixer',
  date: '2026-09-24',
  isMembersOnly: true,
})

const ronit = buildRegistrant({
  id: 'r1',
  eventId: 'a',
  name: 'Ronit Amsalem',
  email: 'ronit.amsalem@example.com',
})
const nadav = buildRegistrant({
  id: 'r2',
  eventId: 'a',
  name: 'Nadav Peleg',
  email: 'nadav.peleg@example.com',
})
const tal = buildRegistrant({ id: 'r3', eventId: 'a', name: 'Tal Rimon', email: undefined })

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })
const ori = buildMember({ rowNumber: 3, name: 'Ori Weintraub', mail: 'ori.weintraub@example.com' })

const openCheckIn = async ({
  event = autumnMixer,
  registrants = [ronit, nadav, tal],
  members = [dana, ori],
  attendanceStore = createFakeAttendanceStore(),
}: {
  event?: CommunityEvent
  registrants?: readonly Registrant[]
  members?: readonly Member[]
  attendanceStore?: ReturnType<typeof createFakeAttendanceStore>
} = {}) => {
  render(
    <EventsWorkspace
      attendanceStore={attendanceStore}
      attachedSheets={[]}
      events={[event]}
      members={members}
      onReloadRegistrants={vi.fn()}
      onSessionExpired={vi.fn()}
      onRequestRegistrants={vi.fn()}
      registrantLoads={buildRegistrantLoads(registrants)}
      responseSheetAccess={createFakeResponseSheetAccess()}
      today={TODAY}
      writer={createFakeEventRegistryWriter()}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Autumn Mixer' }))
  await userEvent.click(screen.getByRole('button', { name: /check in at the door/i }))
  await screen.findByText(/every check-in is saved/i)
  return { attendanceStore }
}

const doorList = () => within(screen.getByRole('tabpanel'))

const nameOnDoor = (name: RegExp) => doorList().getByRole('button', { name })

const pendingTab = () => screen.getByRole('tab', { name: /pending/i })

const arrivedTab = () => screen.getByRole('tab', { name: /arrived/i })

const typeSearch = async (searchText: string) => {
  await userEvent.type(screen.getByLabelText(/search by name or email/i), searchText)
}

describe('CheckInScreen search', () => {
  it('should label the search box, since it is the only thing the door types into', async () => {
    await openCheckIn()

    expect(screen.getByLabelText(/search by name or email/i)).toBeInTheDocument()
  })

  it('should find a person from the first three letters of their name', async () => {
    await openCheckIn()

    await typeSearch('ron')

    expect(doorList().getAllByRole('listitem')).toHaveLength(1)
    expect(doorList().getByText('Ronit Amsalem')).toBeInTheDocument()
  })

  it('should find a person by email', async () => {
    await openCheckIn()

    await typeSearch('nadav.peleg@')

    expect(doorList().getAllByRole('listitem')).toHaveLength(1)
    expect(doorList().getByText('Nadav Peleg')).toBeInTheDocument()
  })

  it('should list a registrant whose sheet never captured an email', async () => {
    await openCheckIn()

    await typeSearch('rimon')

    expect(doorList().getByText('Tal Rimon')).toBeInTheDocument()
  })

  it('should say when nobody matches instead of showing an empty screen', async () => {
    await openCheckIn()

    await typeSearch('zzz')

    expect(screen.getByText(/nobody on the list matches/i)).toBeInTheDocument()
  })

  it('should search the arrived tab when the arrived tab is the one showing', async () => {
    await openCheckIn({ registrants: [ronit, { ...nadav, checkedInAt: '2026-09-24T19:00:00.000Z' }] })

    await userEvent.click(arrivedTab())
    await typeSearch('nadav')

    expect(doorList().getByText('Nadav Peleg')).toBeInTheDocument()
  })
})

describe('CheckInScreen two tabs', () => {
  it('should open on the pending tab, which is what a door works through', async () => {
    await openCheckIn()

    expect(pendingTab()).toHaveAttribute('aria-selected', 'true')
  })

  it('should count the people still to arrive on the pending tab', async () => {
    await openCheckIn()

    expect(pendingTab()).toHaveTextContent('3')
  })

  it('should read the tab and its count as two words, not one', async () => {
    await openCheckIn()

    expect(pendingTab()).toHaveAccessibleName('Pending 3')
  })

  it('should count the people already in on the arrived tab', async () => {
    await openCheckIn({ registrants: [ronit, { ...nadav, checkedInAt: '2026-09-24T19:00:00.000Z' }] })

    expect(arrivedTab()).toHaveTextContent('1')
  })

  it('should move somebody out of pending when they are checked in', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(doorList().queryByText('Ronit Amsalem')).not.toBeInTheDocument()
  })

  it('should move somebody into arrived when they are checked in', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Ronit Amsalem')).toBeInTheDocument()
  })

  it('should count the tabs up and down as somebody is checked in', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(pendingTab()).toHaveTextContent('2')
    expect(arrivedTab()).toHaveTextContent('1')
  })

  it('should stay on pending when somebody is checked in, so the queue keeps moving', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(pendingTab()).toHaveAttribute('aria-selected', 'true')
  })

  it('should say the pending tab is empty once everybody has arrived', async () => {
    await openCheckIn({ registrants: [{ ...ronit, checkedInAt: '2026-09-24T19:00:00.000Z' }] })

    expect(screen.getByText(/everybody on the list has arrived/i)).toBeInTheDocument()
  })

  it('should say the arrived tab is empty before anybody is tapped in', async () => {
    await openCheckIn()

    await userEvent.click(arrivedTab())

    expect(screen.getByText(/nobody has been checked in yet/i)).toBeInTheDocument()
  })

  it('should move between the tabs on an arrow key, like every other tab strip', async () => {
    await openCheckIn()

    pendingTab().focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(arrivedTab()).toHaveAttribute('aria-selected', 'true')
    expect(arrivedTab()).toHaveFocus()
  })

  it('should keep only the selected tab in the tab order', async () => {
    await openCheckIn()

    expect(pendingTab()).toHaveAttribute('tabindex', '0')
    expect(arrivedTab()).toHaveAttribute('tabindex', '-1')
  })

  it('should label the list the tabs switch between', async () => {
    await openCheckIn()

    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/pending/i)
  })
})

describe('CheckInScreen undoing a check-in', () => {
  const checkInRonit = async () => {
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(arrivedTab())
  }

  it('should undo the check-in when the person is tapped on the arrived tab', async () => {
    await openCheckIn()

    await checkInRonit()
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(pendingTab())

    expect(doorList().getByText('Ronit Amsalem')).toBeInTheDocument()
  })

  it('should say in words that a tap on the arrived tab undoes the check-in', async () => {
    await openCheckIn()

    await checkInRonit()

    expect(nameOnDoor(/Ronit Amsalem/)).toHaveTextContent(/undo/i)
  })

  it('should put the most recent arrival at the top, where the mis-tap is', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Nadav Peleg/))
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(arrivedTab())

    expect(doorList().getAllByRole('listitem')[0]).toHaveTextContent('Ronit Amsalem')
  })

  it('should count back down when a check-in is undone', async () => {
    await openCheckIn()

    await checkInRonit()
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 checked in')
  })
})

describe('CheckInScreen searching for somebody who is already in', () => {
  const checkInRonitAndSearch = async () => {
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await typeSearch('ronit')
  }

  it('should say the person is already checked in rather than that nobody matches', async () => {
    await openCheckIn()

    await checkInRonitAndSearch()

    expect(screen.getByText(/already checked in/i)).toBeInTheDocument()
    expect(screen.queryByText(/nobody on the list matches/i)).not.toBeInTheDocument()
  })

  it('should name the person who is already in, so the door can say it out loud', async () => {
    await openCheckIn()

    await checkInRonitAndSearch()

    expect(doorList().getByText(/Ronit Amsalem/)).toBeInTheDocument()
  })

  it('should offer to show them, without switching the tab by itself', async () => {
    await openCheckIn()

    await checkInRonitAndSearch()

    expect(pendingTab()).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /show in arrived/i })).toBeInTheDocument()
  })

  it('should show them on the arrived tab when the offer is taken', async () => {
    await openCheckIn()

    await checkInRonitAndSearch()
    await userEvent.click(screen.getByRole('button', { name: /show in arrived/i }))

    expect(arrivedTab()).toHaveAttribute('aria-selected', 'true')
    expect(doorList().getByText('Ronit Amsalem')).toBeInTheDocument()
  })

  it('should say a searched person has not arrived when the arrived tab is showing', async () => {
    await openCheckIn()

    await userEvent.click(arrivedTab())
    await typeSearch('nadav')

    expect(screen.getByText(/not arrived yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show in pending/i })).toBeInTheDocument()
  })
})

describe('CheckInScreen running count', () => {
  it('should show how many of the expected people have arrived', async () => {
    await openCheckIn()

    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 checked in')
  })

  it('should count up as people are tapped in', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 checked in')
  })

  it('should keep the running count in view on both tabs', async () => {
    await openCheckIn()

    await userEvent.click(arrivedTab())

    expect(screen.getByRole('status')).toHaveTextContent('0 of 3 checked in')
  })

  it('should announce the count, so a screen reader hears it change', async () => {
    await openCheckIn()

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('should never call anybody a no-show at a door that is still open', async () => {
    await openCheckIn()

    expect(screen.queryByText(/no-show/i)).not.toBeInTheDocument()
  })

  it('should keep the check-in when the organiser goes back to the event', async () => {
    await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(screen.getByRole('button', { name: /back to the event/i }))

    expect(screen.getByText(/1 checked in/)).toBeInTheDocument()
  })
})

describe('CheckInScreen adding a member who never filled the form', () => {
  const searchCommunity = async (searchText: string) => {
    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.type(screen.getByLabelText(/search the community list/i), searchText)
  }

  const communityResults = () => within(screen.getByRole('list', { name: /community/i }))

  it('should search the community by name', async () => {
    await openCheckIn()

    await searchCommunity('dana')

    expect(communityResults().getByText('Dana Sorkin')).toBeInTheDocument()
    expect(communityResults().queryByText('Ori Weintraub')).not.toBeInTheDocument()
  })

  it('should search the community by email', async () => {
    await openCheckIn()

    await searchCommunity('ori.weintraub@')

    expect(communityResults().getByText('Ori Weintraub')).toBeInTheDocument()
  })

  it('should show nobody until something is typed, rather than the whole community', async () => {
    await openCheckIn()

    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))

    expect(screen.queryByRole('list', { name: /community/i })).not.toBeInTheDocument()
  })

  it('should add the member straight to the arrived list', async () => {
    await openCheckIn()

    await searchCommunity('dana')
    await userEvent.click(screen.getByRole('button', { name: /add dana sorkin/i }))
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Dana Sorkin')).toBeInTheDocument()
  })

  it('should count the member as checked in, because they are standing there', async () => {
    await openCheckIn()

    await searchCommunity('dana')
    await userEvent.click(screen.getByRole('button', { name: /add dana sorkin/i }))

    expect(screen.getByRole('status')).toHaveTextContent('1 of 4 checked in')
  })

  it('should record them as a matched member, not as somebody nobody can place', async () => {
    await openCheckIn()

    await searchCommunity('dana')
    await userEvent.click(screen.getByRole('button', { name: /add dana sorkin/i }))
    await userEvent.click(screen.getByRole('button', { name: /back to the event/i }))

    const danaRow = screen.getByRole('row', { name: /Dana Sorkin/ })
    expect(within(danaRow).getByText('Member')).toBeInTheDocument()
  })

  it('should say the search reads the Members tab and the walk-in is saved', async () => {
    await openCheckIn()

    await searchCommunity('dana')

    expect(screen.getByText(/searches your members tab/i)).toBeInTheDocument()
    expect(screen.getByText(/a walk-in added here is saved/i)).toBeInTheDocument()
  })
})

describe('CheckInScreen adding a member who is already registered', () => {
  const danaRegistered = buildRegistrant({
    id: 'r9',
    eventId: 'a',
    name: 'Dana Sorkin',
    email: 'dana.sorkin@example.com',
  })

  const searchForDana = async () => {
    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.type(screen.getByLabelText(/search the community list/i), 'dana')
  }

  it('should say the member is already on this list rather than adding them twice', async () => {
    await openCheckIn({ registrants: [ronit, danaRegistered] })

    await searchForDana()

    expect(screen.getByText(/already on this list/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add dana sorkin/i })).not.toBeInTheDocument()
  })

  it('should offer to check the registered member in instead', async () => {
    await openCheckIn({ registrants: [ronit, danaRegistered] })

    await searchForDana()
    await userEvent.click(screen.getByRole('button', { name: /check in dana sorkin/i }))
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Dana Sorkin')).toBeInTheDocument()
  })

  it('should leave one row for a member who was already on the list', async () => {
    await openCheckIn({ registrants: [ronit, danaRegistered] })

    await searchForDana()
    await userEvent.click(screen.getByRole('button', { name: /check in dana sorkin/i }))

    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 checked in')
  })

  it('should say a member who is already in is already in, and offer no second row', async () => {
    await openCheckIn({
      registrants: [{ ...danaRegistered, checkedInAt: '2026-09-24T19:00:00.000Z' }],
    })

    await searchForDana()

    expect(screen.getByText(/already checked in/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add dana sorkin/i })).not.toBeInTheDocument()
  })
})

describe('CheckInScreen adding somebody who is not a member', () => {
  const addNonMember = async ({ name, email }: { name: string; email: string }) => {
    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.click(screen.getByLabelText(/not a pridetech member/i))
    if (name !== '') {
      await userEvent.type(screen.getByLabelText(/^name/i), name)
    }
    if (email !== '') {
      await userEvent.type(screen.getByLabelText(/^email/i), email)
    }
    await userEvent.click(screen.getByRole('button', { name: /^add walk-in$/i }))
  }

  it('should hide the name and email boxes until the organiser says they are not a member', async () => {
    await openCheckIn()

    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))

    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument()
  })

  it('should reveal the name and email boxes when the organiser says they are not a member', async () => {
    await openCheckIn()

    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.click(screen.getByLabelText(/not a pridetech member/i))

    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
  })

  it('should put the walk-in straight on the arrived list', async () => {
    await openCheckIn()

    await addNonMember({ name: 'Shai Lavon', email: 'shai.lavon@example.com' })
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Shai Lavon')).toBeInTheDocument()
  })

  it('should accept a walk-in who would not give an email', async () => {
    await openCheckIn()

    await addNonMember({ name: 'Shai Lavon', email: '' })

    expect(screen.getByRole('status')).toHaveTextContent('1 of 4 checked in')
  })

  it('should refuse a walk-in with no name, since nothing else identifies them', async () => {
    await openCheckIn()

    await addNonMember({ name: '', email: 'shai.lavon@example.com' })

    expect(screen.getByText(/a walk-in needs a name/i)).toBeInTheDocument()
  })

  it('should mark a walk-in as one, so nobody reads them back as an RSVP', async () => {
    await openCheckIn()

    await addNonMember({ name: 'Shai Lavon', email: 'shai.lavon@example.com' })
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Walk-in')).toBeInTheDocument()
  })

  it('should mark somebody the member list does not know, which is what a door needs to see', async () => {
    await openCheckIn()

    await addNonMember({ name: 'Shai Lavon', email: 'shai.lavon@example.com' })
    await userEvent.click(arrivedTab())

    expect(doorList().getByText(/not in the member list/i)).toBeInTheDocument()
  })

  it('should say nothing about membership for somebody the member list knows', async () => {
    await openCheckIn({
      registrants: [buildRegistrant({ id: 'r1', eventId: 'a', name: dana.name, email: dana.mail })],
    })

    expect(doorList().queryByText(/not in the member list/i)).not.toBeInTheDocument()
  })
})

describe('CheckInScreen members-only policy', () => {
  const openManualEntry = async () => {
    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.click(screen.getByLabelText(/not a pridetech member/i))
  }

  it('should warn before a non-member is added to a members-only event', async () => {
    await openCheckIn({ event: membersOnlyMixer })

    await openManualEntry()

    expect(screen.getByText(/this event is members only/i)).toBeInTheDocument()
  })

  it('should still let the non-member in, because the door decides, not the app', async () => {
    await openCheckIn({ event: membersOnlyMixer })

    await openManualEntry()
    await userEvent.type(screen.getByLabelText(/^name/i), 'Shai Lavon')
    await userEvent.click(screen.getByRole('button', { name: /^add walk-in$/i }))
    await userEvent.click(arrivedTab())

    expect(doorList().getByText('Shai Lavon')).toBeInTheDocument()
  })

  it('should leave a record that a non-member was let into a members-only event', async () => {
    await openCheckIn({ event: membersOnlyMixer })

    await openManualEntry()
    await userEvent.type(screen.getByLabelText(/^name/i), 'Shai Lavon')
    await userEvent.click(screen.getByRole('button', { name: /^add walk-in$/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/members only/i)
  })

  it('should say nothing about policy at an event that accepts non-members', async () => {
    await openCheckIn()

    await openManualEntry()

    expect(screen.queryByText(/this event is members only/i)).not.toBeInTheDocument()
  })

  it('should say nothing about policy when a member is added to a members-only event', async () => {
    await openCheckIn({ event: membersOnlyMixer })

    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.type(screen.getByLabelText(/search the community list/i), 'dana')
    await userEvent.click(screen.getByRole('button', { name: /add dana sorkin/i }))

    expect(screen.getByRole('status')).not.toHaveTextContent(/members only/i)
  })
})

describe('CheckInScreen saving to the Attendance tab', () => {
  it('should say every check-in is saved to the Attendance tab', async () => {
    await openCheckIn()

    expect(screen.getByText(/every check-in is saved to the attendance tab/i)).toBeInTheDocument()
  })

  it('should write a check-in to the Attendance tab', async () => {
    const { attendanceStore } = await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(attendanceStore.log).toEqual([
      expect.objectContaining({ name: 'Ronit Amsalem', status: 'attended' }),
    ])
  })

  it('should write an undone check-in as a new row rather than remove the first', async () => {
    const { attendanceStore } = await openCheckIn()

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))
    await userEvent.click(arrivedTab())
    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(attendanceStore.log.map((entry) => entry.status)).toEqual(['attended', 'undone'])
  })

  it('should write a walk-in to the Attendance tab', async () => {
    const { attendanceStore } = await openCheckIn()

    await userEvent.click(screen.getByRole('button', { name: /add someone not on the list/i }))
    await userEvent.click(screen.getByLabelText(/not a pridetech member/i))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Shai Lavon')
    await userEvent.click(screen.getByRole('button', { name: /^add walk-in$/i }))

    expect(attendanceStore.log).toEqual([
      expect.objectContaining({ name: 'Shai Lavon', email: undefined, status: 'attended' }),
    ])
  })

  it('should show somebody checked in on another phone as already arrived', async () => {
    await openCheckIn({
      attendanceStore: createFakeAttendanceStore([
        {
          eventId: autumnMixer.id,
          email: ronit.email,
          name: ronit.name,
          status: 'attended',
          at: '2026-09-24T18:00:00.000Z',
        },
      ]),
    })

    await userEvent.click(arrivedTab())

    expect(nameOnDoor(/Ronit Amsalem/)).toBeInTheDocument()
  })

  it('should take a check-in back and say so when the sheet refuses it', async () => {
    const attendanceStore = createFakeAttendanceStore()
    attendanceStore.appendEntry = vi.fn(async () => {
      throw new Error('Quota exceeded')
    })
    await openCheckIn({ attendanceStore })

    await userEvent.click(nameOnDoor(/Ronit Amsalem/))

    expect(await screen.findByText(/ronit amsalem was not saved/i)).toBeInTheDocument()
    expect(within(pendingTab()).getByText('3')).toBeInTheDocument()
  })
})
