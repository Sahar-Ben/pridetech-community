/* The wordmark: a short rainbow bar, the name, and what this copy of it is for
   in small monospace. The heading level is the caller's, because the same mark
   heads the workspace (h1) and sits over the sign-in and picker screens' own
   headings. */
export const BrandMark = ({ as: Heading = 'div' }: { as?: 'h1' | 'div' }) => (
  <div className="flex items-center gap-2.5">
    <span aria-hidden="true" className="rainbow-mark h-[30px]" />
    <Heading className="m-0 flex flex-col gap-0.5">
      <span className="text-[19px] leading-tight font-semibold tracking-[-0.01em] text-ink">
        PrideTech
      </span>{' '}
      <span className="font-mono text-[10px] font-normal tracking-[0.14em] text-ink-faint uppercase">
        Community · Admin
      </span>
    </Heading>
  </div>
)
