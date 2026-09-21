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

export const INVALID_FIELD_BORDER_CLASSES = 'border-danger-edge focus:border-danger-edge'

export const READ_ONLY_FIELD_CONTROL_CLASSES =
  'w-full rounded-xl border border-hairline bg-surface-sunken px-3 py-2 text-sm text-ink-muted'

export const FIELD_ERROR_CLASSES = 'text-xs font-semibold text-danger-ink'
