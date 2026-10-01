/* The one decision this app's styling turns on: which of these a thing gets.

   Glass is brand. It is translucent at the shell's 0.1, it is 28px-rounded, it
   carries white text, and its contrast depends on the gradient behind it --
   which is why nothing smaller or denser than a page heading is ever put on it.

   White is the only ink allowed on glass, and there is no muted companion to it
   on purpose: it clears 4.5:1 over glass at the gradient's lightest point
   (4.82:1) and the same white at 95% alpha is already down to 4.54:1. Hierarchy
   on the gradient is size and weight; a dimmed white here is a contrast failure
   waiting for somebody to nudge one stop lighter. */

export const GLASS_PANEL_CLASSES = 'glass-panel'

/* Opaque, so its contrast does not depend on the gradient, on the blur support
   of the browser, or on what scrolled behind it. One screen still wants that
   promise and it is the check-in list: read one-handed at a venue door in bad
   light, and given the least styling in the app on purpose. */
export const DATA_PANEL_CLASSES = 'data-panel'

/* Brand again, but eight times deeper than the shell's glass, which is what
   turns "it depends on the backdrop" back into a measured number. The dashboard
   wears it at the brand radius with a blur. */
export const CHART_PANEL_CLASSES = 'chart-panel'

/* The same fill for the screens that are worked rather than glanced at: the
   applications queue and the members directory. Tighter radius and no blur --
   see the rule in `index.css` for both reasons -- and it re-points the ink,
   hairline, edge and surface variables underneath it, so a component written
   for a white panel renders correctly on this one without knowing it moved. */
export const WORK_PANEL_CLASSES = 'work-panel'

export const SHELL_SECTION_TITLE_CLASSES =
  'm-0 text-[30px] leading-tight font-semibold tracking-[-0.03em] text-on-brand'

export const SHELL_HERO_TITLE_CLASSES =
  'text-4xl leading-tight font-semibold tracking-[-0.03em] text-on-brand'

/* A record title is somebody's name or an event's name read off the sheet, so
   it is set in the body face at a weight that reads, not as display type. */
export const RECORD_TITLE_CLASSES = 'text-3xl font-bold tracking-tight text-ink'

export const NOTICE_SURFACE_CLASSES = {
  danger: 'border-danger-edge bg-danger-surface text-danger-ink',
  warning: 'border-warning-edge bg-warning-surface text-warning-ink',
  success: 'border-success-edge bg-success-surface text-success-ink',
} as const

export const EMPTY_STATE_CLASSES = [
  'rounded-[var(--radius-brand)] border border-dashed border-card-strong-edge bg-card',
  'px-4 py-10 text-center text-on-brand',
].join(' ')
