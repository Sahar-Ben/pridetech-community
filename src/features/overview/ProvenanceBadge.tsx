import { PROVENANCE_SURFACES, PROVENANCE_WORDS, type Provenance } from './provenance'

const BADGE_CLASSES =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase'

type ProvenanceBadgeProps = {
  provenance: Provenance
}

export const ProvenanceBadge = ({ provenance }: ProvenanceBadgeProps) => (
  <span className={`${BADGE_CLASSES} ${PROVENANCE_SURFACES[provenance]}`}>
    {PROVENANCE_WORDS[provenance]}
  </span>
)
