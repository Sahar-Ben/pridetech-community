/* The one screen the gradient never reaches. Everything from the back button
   down sits on an opaque sheet, so a queue of people is read against a fixed
   background rather than against whatever the canvas is doing behind it. */
export const DOOR_SHEET_CLASSES = [
  'flex flex-col gap-3 rounded-[var(--radius-data)] border border-hairline bg-surface',
  'px-3 py-4 shadow-data sm:px-5',
].join(' ')

/* Opaque and not blurred: this strip is what the organiser's thumb lives on,
   and a translucent one would put the names underneath it inside it. */
export const DOOR_CONTROLS_CLASSES = [
  'sticky top-0 z-10 -mx-3 flex flex-col gap-2 border-b border-hairline bg-surface',
  'px-3 py-3 sm:-mx-5 sm:px-5',
].join(' ')
