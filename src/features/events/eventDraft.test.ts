import { describe, expect, it } from 'vitest'
import { buildEvent } from '../../testing/eventFactory'
import {
  applyDraftToEvent,
  createEventFromDraft,
  EMPTY_EVENT_DRAFT,
  hasEventDraftErrors,
  toEventDraft,
  validateEventDraft,
} from './eventDraft'

const filledDraft = {
  name: 'Autumn Hiring Mixer',
  date: '2026-10-15',
  host: 'Fennimore Labs',
  location: 'Fennimore Labs, Tel Aviv',
  isMembersOnly: true,
}

describe('toEventDraft', () => {
  it('should open the form on what the event already says', () => {
    const event = buildEvent({
      name: 'Summer Social',
      date: '2026-08-01',
      host: 'Halberd Analytics',
      location: 'Halberd rooftop, Ramat Gan',
      isMembersOnly: true,
    })

    expect(toEventDraft(event)).toEqual({
      name: 'Summer Social',
      date: '2026-08-01',
      host: 'Halberd Analytics',
      location: 'Halberd rooftop, Ramat Gan',
      isMembersOnly: true,
    })
  })

  it('should show an empty host box for an event nobody hosts', () => {
    expect(toEventDraft(buildEvent({ host: undefined })).host).toBe('')
  })
})

describe('applyDraftToEvent', () => {
  it('should keep the identity and the attendance flags the draft does not cover', () => {
    const event = buildEvent({ id: 'a', isClosedOut: true, isArchived: true })

    const updated = applyDraftToEvent({ event, draft: filledDraft })

    expect(updated).toMatchObject({ id: 'a', isClosedOut: true, isArchived: true })
  })

  it('should take the edited values', () => {
    const updated = applyDraftToEvent({ event: buildEvent(), draft: filledDraft })

    expect(updated).toMatchObject({
      name: 'Autumn Hiring Mixer',
      date: '2026-10-15',
      host: 'Fennimore Labs',
      location: 'Fennimore Labs, Tel Aviv',
    })
  })

  it('should record a blank host as absent rather than as an empty name', () => {
    const updated = applyDraftToEvent({ event: buildEvent(), draft: { ...filledDraft, host: ' ' } })

    expect(updated.host).toBeUndefined()
  })
})

describe('createEventFromDraft', () => {
  it('should create an event that is open and listed', () => {
    const created = createEventFromDraft({ id: 'event-9', draft: filledDraft })

    expect(created).toEqual({
      id: 'event-9',
      name: 'Autumn Hiring Mixer',
      date: '2026-10-15',
      host: 'Fennimore Labs',
      location: 'Fennimore Labs, Tel Aviv',
      isMembersOnly: true,
      isClosedOut: false,
      isArchived: false,
    })
  })
})

describe('validateEventDraft', () => {
  it('should accept a filled-in event', () => {
    expect(hasEventDraftErrors(validateEventDraft(filledDraft))).toBe(false)
  })

  it('should refuse an event with no name', () => {
    expect(validateEventDraft({ ...filledDraft, name: '  ' }).name).toMatch(/name/i)
  })

  it('should refuse an event with no date, since the listing is ordered by it', () => {
    expect(validateEventDraft({ ...filledDraft, date: '' }).date).toMatch(/date/i)
  })

  it('should refuse a date that is not a real calendar day', () => {
    expect(validateEventDraft({ ...filledDraft, date: '2026-02-31' }).date).toMatch(/date/i)
  })

  it('should refuse a date that is not written the way the listing sorts them', () => {
    expect(validateEventDraft({ ...filledDraft, date: '15/10/2026' }).date).toMatch(/date/i)
  })

  it('should refuse an event with nowhere to turn up to', () => {
    expect(validateEventDraft({ ...filledDraft, location: '' }).location).toMatch(/location/i)
  })

  it('should accept an event with no host company', () => {
    expect(hasEventDraftErrors(validateEventDraft({ ...filledDraft, host: '' }))).toBe(false)
  })

  it('should start the add form with every box empty', () => {
    expect(EMPTY_EVENT_DRAFT).toMatchObject({ name: '', date: '', host: '', location: '' })
  })
})

describe('the members-only policy of an event', () => {
  it('should open the form on the policy the event already has', () => {
    expect(toEventDraft(buildEvent({ isMembersOnly: true })).isMembersOnly).toBe(true)
  })

  it('should start a new event members only, since almost every event is', () => {
    expect(EMPTY_EVENT_DRAFT.isMembersOnly).toBe(true)
  })

  it('should keep a new event open to non-members when the organiser said so', () => {
    const singlesNight = createEventFromDraft({
      id: 'event-1',
      draft: { ...filledDraft, isMembersOnly: false },
    })

    expect(singlesNight.isMembersOnly).toBe(false)
  })

  it('should change the policy of an event that was edited', () => {
    const updated = applyDraftToEvent({
      event: buildEvent({ isMembersOnly: true }),
      draft: { ...filledDraft, isMembersOnly: false },
    })

    expect(updated.isMembersOnly).toBe(false)
  })
})
