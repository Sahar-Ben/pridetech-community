import type { ResponseSheetAttachment } from './attachResponseSheet'
import type { CommunityEvent } from './communityEvent'
import type { EventDraft } from './eventDraft'

/* What the events screens are allowed to change, and nothing else. Every one
   of these settles with the sheet before it resolves, and the screen reloads
   the registry afterwards rather than believing its own copy. */
export type EventRegistryWriter = {
  addEvent: (options: { draft: EventDraft }) => Promise<void>
  saveEvent: (options: {
    originalEvent: CommunityEvent
    updatedEvent: CommunityEvent
  }) => Promise<void>
  attachSheet: (options: { attachment: ResponseSheetAttachment }) => Promise<void>
}
