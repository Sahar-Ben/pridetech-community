import type { CommunityEvent, NewEvent } from './communityEvent'

export type EventDraft = {
  name: string
  date: string
  host: string
  location: string
  isMembersOnly: boolean
}

export type EventDraftErrors = Partial<Record<keyof EventDraft, string>>

/* A new event is members only until somebody says otherwise: that is what
   almost every event is, and the flag only ever produces a warning. */
export const EMPTY_EVENT_DRAFT: EventDraft = {
  name: '',
  date: '',
  host: '',
  location: '',
  isMembersOnly: true,
}

const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/

const toOptionalText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export const toEventDraft = (event: CommunityEvent): EventDraft => ({
  name: event.name,
  date: event.date,
  host: event.host ?? '',
  location: event.location,
  isMembersOnly: event.isMembersOnly,
})

const toEventFields = (draft: EventDraft) => ({
  name: draft.name.trim(),
  date: draft.date.trim(),
  host: toOptionalText(draft.host),
  location: draft.location.trim(),
  isMembersOnly: draft.isMembersOnly,
})

export const applyDraftToEvent = ({
  event,
  draft,
}: {
  event: CommunityEvent
  draft: EventDraft
}): CommunityEvent => ({ ...event, ...toEventFields(draft) })

export const createEventFromDraft = ({
  id,
  draft,
}: {
  id: string
  draft: EventDraft
}): NewEvent => ({
  id,
  ...toEventFields(draft),
  isClosedOut: false,
  isArchived: false,
})

/* Round-tripping through `Date` is what rejects 2026-02-31: the shape test
   alone would accept a day that never happens, and the listing sorts on this
   value. */
const isRealCalendarDay = (date: string): boolean =>
  new Date(`${date}T00:00:00Z`).toISOString().startsWith(date)

const findDateError = (date: string): string | undefined => {
  if (date.trim() === '') {
    return 'An event needs a date: the listing splits upcoming from past on it.'
  }
  if (!ISO_DATE_SHAPE.test(date.trim()) || !isRealCalendarDay(date.trim())) {
    return 'Give the date as YYYY-MM-DD.'
  }
  return undefined
}

export const validateEventDraft = (draft: EventDraft): EventDraftErrors => {
  const name = draft.name.trim() === '' ? 'An event needs a name.' : undefined
  const date = findDateError(draft.date)
  const location = draft.location.trim() === '' ? 'An event needs a location.' : undefined

  return {
    ...(name !== undefined && { name }),
    ...(date !== undefined && { date }),
    ...(location !== undefined && { location }),
  }
}

export const hasEventDraftErrors = (errors: EventDraftErrors): boolean =>
  Object.keys(errors).length > 0
