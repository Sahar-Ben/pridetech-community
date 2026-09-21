/* Colour and shape here, size at the call site: the same secondary button is
   a compact one in a list row and a touch target on the check-in screen, and
   writing the palette out twice is how the two drift apart. */
export const PRIMARY_BUTTON_CLASSES =
  'rounded-md bg-indigo-600 font-medium text-white hover:bg-indigo-700'

export const SECONDARY_BUTTON_CLASSES =
  'rounded-md border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

export const COMPACT_BUTTON_SIZE_CLASSES = 'px-3 py-1.5 text-sm'

/* `min-h-12` is a thumb, not a mouse pointer. */
export const TOUCH_BUTTON_SIZE_CLASSES = 'min-h-12 px-4 py-2 text-sm'
