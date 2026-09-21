/* What the organiser last did that went no further than this browser. Held as
   data rather than a boolean so the notice can say what was changed, which is
   the part that matters for archiving: the event vanished from the list and
   the reason it is not gone needs saying. */
export type EventLocalChange =
  | { kind: 'event-saved'; eventName: string }
  | { kind: 'event-archived'; eventName: string }
