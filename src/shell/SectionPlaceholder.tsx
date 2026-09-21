import { GLASS_PANEL_CLASSES, SHELL_HERO_TITLE_CLASSES } from '../theme/surfaces'

type SectionPlaceholderProps = {
  title: string
  plannedContent: string
}

export const SectionPlaceholder = ({ title, plannedContent }: SectionPlaceholderProps) => (
  <section className="mx-auto w-full max-w-4xl px-4 py-16">
    <div className={`${GLASS_PANEL_CLASSES} animate-rise px-6 py-16 text-center`}>
      <h2 className={SHELL_HERO_TITLE_CLASSES}>{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-on-brand">Not built yet. {plannedContent}</p>
    </div>
  </section>
)
