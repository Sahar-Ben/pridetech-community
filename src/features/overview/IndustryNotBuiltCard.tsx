import { CHART_PANEL_CLASSES } from '../../theme/surfaces'

const CARD_CLASSES = `${CHART_PANEL_CLASSES} animate-rise flex flex-col gap-2 border-dashed px-5 py-4`

/* A JSX text node is not a string literal, so an escape written straight into
   the markup would be shown to the reader as `\u{2014}`. */
const EM_DASH = '\u{2014}'

/* Deliberately empty. The sheet records where somebody works, not what that
   company does, and there is no honest route from "Playtika" to "Gaming"
   without a list somebody maintains and stands behind. A chart built on a
   guessed mapping would be indistinguishable on screen from the counted ones
   beside it, which is exactly why it is not here. */
export const IndustryNotBuiltCard = () => (
  <section className={CARD_CLASSES}>
    <h3 className="text-lg font-bold tracking-tight text-on-brand">Industry</h3>
    <p className="text-sm font-medium text-panel-deep-ink-muted">
      Not built. The Members tab records company names, not industries, and mapping one to the
      other takes a list that somebody keeps up to date.
    </p>
    <p className="text-sm font-medium text-panel-deep-ink-muted">
      {`Tell us how you want to supply it ${EM_DASH} an industry column on the Members tab, or a separate tab mapping each company to its industry ${EM_DASH} and this becomes a chart like the others.`}
    </p>
  </section>
)
