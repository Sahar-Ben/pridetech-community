type SectionPlaceholderProps = {
  title: string
  plannedContent: string
}

export const SectionPlaceholder = ({ title, plannedContent }: SectionPlaceholderProps) => (
  <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
      Not built yet. {plannedContent}
    </p>
  </section>
)
