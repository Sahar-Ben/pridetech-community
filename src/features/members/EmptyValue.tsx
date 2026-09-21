const EM_DASH = '\u{2014}'

/* A blank cell is information on this sheet, so it is spelled out for a screen
   reader instead of being left as a dash nobody announces. */
export const EmptyValue = () => (
  <>
    <span aria-hidden="true" className="text-ink-muted/70">
      {EM_DASH}
    </span>
    <span className="sr-only">Not recorded</span>
  </>
)
