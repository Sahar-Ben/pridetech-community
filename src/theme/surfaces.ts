/* The one decision this app's styling turns on: which of these two a thing gets.

   Glass is brand. It is translucent, it is 28px-rounded, it carries white text,
   and its contrast depends on the gradient behind it -- which is why nothing
   smaller or denser than a page heading is ever put on it.

   A data panel is opaque. Its contrast is a fixed number. The applications
   queue, the members table and the check-in list are all data panels, and they
   stay that way no matter how much of the shell turns to glass around them.

   White is the only ink allowed on glass, and there is no muted companion to it
   on purpose: it clears 4.5:1 over glass at the gradient's lightest point
   (4.82:1) and the same white at 95% alpha is already down to 4.54:1. Hierarchy
   on the gradient is size and weight; a dimmed white here is a contrast failure
   waiting for somebody to nudge one stop lighter. */

export const GLASS_PANEL_CLASSES = 'glass-panel'

export const DATA_PANEL_CLASSES = 'data-panel'

export const SHELL_SECTION_TITLE_CLASSES =
  'font-display text-2xl font-light tracking-tight text-on-brand'

export const SHELL_HERO_TITLE_CLASSES =
  'font-display text-4xl leading-tight font-light tracking-tight text-on-brand'

/* Source Sans 3, not Sulphur Point, even at 30px. A record title is somebody's
   name or an event's name read off the sheet: display type would put the one
   value on the screen that has to be right into a light geometric face with a
   Latin-only character set. */
export const RECORD_TITLE_CLASSES = 'text-3xl font-bold tracking-tight text-ink'

export const NOTICE_SURFACE_CLASSES = {
  danger: 'border-danger-edge bg-danger-surface text-danger-ink',
  warning: 'border-warning-edge bg-warning-surface text-warning-ink',
  success: 'border-success-edge bg-success-surface text-success-ink',
} as const

export const EMPTY_STATE_CLASSES = [
  'rounded-[var(--radius-brand)] border border-dashed border-glass-edge bg-glass',
  'px-4 py-10 text-center text-on-brand backdrop-blur-md',
].join(' ')
