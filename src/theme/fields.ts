export const FIELD_LABEL_CLASSES = 'text-xs font-semibold tracking-wide text-ink-muted'

/* The border colour is kept apart from the rest so an invalid field replaces it
   instead of stacking a second border-colour utility over it. */
export const FIELD_CONTROL_CLASSES = [
  'w-full rounded-xl border bg-surface px-3 py-2 text-sm text-ink',
  'transition-[border-color,box-shadow] duration-150 ease-brand',
].join(' ')

/* `--ui-edge` rather than the hairline used between rows: an input's edge is the
   only thing saying where the control is, so it is held at 3:1 on both themes. */
export const FIELD_BORDER_CLASSES = 'border-edge focus:border-accent'

/* `danger-on-panel`, not `danger-edge`: the edge colour is tuned to sit on a
   notice's own light surface, and on the deep panel it fell to 2.0:1 against
   the field it was supposed to be outlining. This pair is 8.0:1 on white and
   8.1:1 on the deep panel. */
export const INVALID_FIELD_BORDER_CLASSES =
  'border-danger-on-panel focus:border-danger-on-panel'

export const READ_ONLY_FIELD_CONTROL_CLASSES =
  'w-full rounded-xl border border-hairline bg-surface-sunken px-3 py-2 text-sm text-ink-muted'

/* `danger-on-panel` rather than `danger-ink`: this sentence is written straight
   onto whatever panel the field is on, and the deep panel re-points it. */
export const FIELD_ERROR_CLASSES = 'text-xs font-semibold text-danger-on-panel'
