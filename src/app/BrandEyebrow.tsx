/* The rainbow appears three times in the whole app and never larger than this:
   a 4px mark beside a word. Anything more and it stops being an accent. */
export const BrandEyebrow = () => (
  <div className="flex items-stretch gap-3">
    <span aria-hidden="true" className="rainbow-mark" />
    <span className="font-display text-sm font-normal tracking-[0.2em] text-on-brand uppercase">
      PrideTech
    </span>
  </div>
)
