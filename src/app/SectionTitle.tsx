import { SHELL_SECTION_TITLE_CLASSES } from '../theme/surfaces'

type SectionTitleProps = {
  eyebrow: string
  title: string
}

/* `// OVERVIEW` over the heading. The eyebrow is decoration -- the heading
   already names the screen -- so it is hidden from assistive technology rather
   than read twice. */
export const SectionTitle = ({ eyebrow, title }: SectionTitleProps) => (
  <div className="flex flex-col gap-1.5">
    <span aria-hidden="true" className="mono-eyebrow">
      {`// ${eyebrow}`}
    </span>
    <h2 className={SHELL_SECTION_TITLE_CLASSES}>{title}</h2>
  </div>
)
