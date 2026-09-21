/* The name of the thing and nothing else. Changing the spreadsheet and signing
   out used to sit here, at the top of every screen, competing with the work;
   they are account actions, and they live in the rail's footer now. */
export const WorkspaceHeader = () => (
  <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3 px-4 pt-6 pb-2">
    <div className="flex items-stretch gap-3">
      <span aria-hidden="true" className="rainbow-mark" />
      <h1 className="font-display text-3xl leading-none font-light tracking-tight text-on-brand sm:text-4xl">
        PrideTech Community
      </h1>
    </div>
  </div>
)
