/* Colour and shape here, size at the call site: the same secondary button is a
   compact one in a list row and a touch target on the check-in screen, and
   writing the palette out twice is how the two drift apart.

   Three variants rather than two, because this app has two kinds of background.
   `SHELL_BUTTON_CLASSES` is the only one that may sit on the gradient; the other
   two assume an opaque surface under them. */

const BUTTON_BASE_CLASSES = [
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
  'transition-[background-color,border-color,box-shadow,transform] duration-150 ease-brand',
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
].join(' ')

export const PRIMARY_BUTTON_CLASSES = [
  BUTTON_BASE_CLASSES,
  'bg-accent-solid text-on-accent shadow-sm hover:bg-accent-solid-hover hover:shadow-md',
].join(' ')

export const SECONDARY_BUTTON_CLASSES = [
  BUTTON_BASE_CLASSES,
  'border border-edge bg-surface text-ink hover:bg-surface-raised',
].join(' ')

export const SHELL_BUTTON_CLASSES = [
  BUTTON_BASE_CLASSES,
  'border border-glass-edge bg-glass text-on-brand backdrop-blur-md hover:bg-glass-hover',
].join(' ')

export const COMPACT_BUTTON_SIZE_CLASSES = 'px-3.5 py-1.5 text-sm'

/* `min-h-12` is a thumb, not a mouse pointer. */
export const TOUCH_BUTTON_SIZE_CLASSES = 'min-h-12 px-5 py-2 text-base'
