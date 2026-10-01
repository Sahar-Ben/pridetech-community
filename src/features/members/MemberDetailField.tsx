import { EmptyValue } from './EmptyValue'

const LINK_CLASSES = 'font-semibold text-accent underline underline-offset-2'

type MemberDetailFieldProps = {
  label: string
  value: string | undefined
  href?: string
}

export const MemberDetailField = ({ label, value, href }: MemberDetailFieldProps) => {
  const doesOpenInNewTab = href !== undefined && href.startsWith('https://')

  return (
    <div className="border-t border-hairline py-2.5">
      <dt className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm wrap-anywhere text-ink">
        {value === undefined && <EmptyValue />}
        {value !== undefined && href === undefined && value}
        {value !== undefined && href !== undefined && (
          <a
            className={LINK_CLASSES}
            href={href}
            rel={doesOpenInNewTab ? 'noopener noreferrer' : undefined}
            target={doesOpenInNewTab ? '_blank' : undefined}
          >
            {value}
          </a>
        )}
      </dd>
    </div>
  )
}
