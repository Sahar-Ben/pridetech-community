/* What the organiser last did, and where it went. Held as data rather than a
   boolean so archiving can say the part that matters: the event left the list
   and the reason it is not gone needs saying. */
export type EventChange =
  | { kind: 'added'; eventName: string }
  | { kind: 'saved'; eventName: string }
  | { kind: 'archived'; eventName: string }
  | { kind: 'sheet-attached'; eventName: string }

export const describeEventChange = (change: EventChange): string => {
  if (change.kind === 'added') {
    return `${change.eventName} was added to the Events tab of your spreadsheet.`
  }
  if (change.kind === 'saved') {
    return `${change.eventName} was saved to the Events tab of your spreadsheet.`
  }
  if (change.kind === 'sheet-attached') {
    return `The response sheet was recorded against ${change.eventName} on the Event sheets tab. Nothing in it has been read yet.`
  }
  return `${change.eventName} was archived on the Events tab, not deleted: the row stays and its attendance is kept, because deleting an event would take it out of every member's event history.`
}
