/* The distinction this whole screen turns on. Gender and company are cells
   somebody typed into the sheet; tenure is a join against the application
   form; discipline and seniority are keyword guesses at free text. Presenting
   the third kind with the confidence of the first is the failure the badge
   exists to prevent, which is why the word is always shown beside the colour
   rather than the colour being left to carry it. */
export const PROVENANCE_SURFACES = {
  counted: 'border-success-edge bg-success-surface text-success-ink',
  derived: 'border-hairline bg-neutral-surface text-neutral-ink',
  inferred: 'border-warning-edge bg-warning-surface text-warning-ink',
} as const

export type Provenance = keyof typeof PROVENANCE_SURFACES

export const PROVENANCE_WORDS: Readonly<Record<Provenance, string>> = {
  counted: 'Counted',
  derived: 'Derived',
  inferred: 'Inferred',
}
