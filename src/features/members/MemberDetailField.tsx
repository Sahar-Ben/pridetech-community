import { EmptyValue } from './EmptyValue'
import { CopyButton } from '../../app/CopyButton'

const LINK_CLASSES = 'font-semibold text-accent underline underline-offset-2'

type MemberDetailFieldProps = {
  label: string
  value: string | undefined
  href?: string
  /* The contact rows get a copy button; the rest are read, not pasted. */
  isCopyable?: boolean
}

export const MemberDetailField = ({
  label,
  value,
  href,
  isCopyable = false,
}: MemberDetailFieldProps) => {
  const doesOpenInNewTab = href !== undefined && href.startsWith('https://')

  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline py-2">
      <div className="min-w-0">
        <dt className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
          {label}
        </dt>
        <dd className="mt-1 text-[15px] wrap-anywhere text-ink">
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
      {isCopyable && value !== undefined && (
        <CopyButton
          label={label.toLowerCase()}
          text={href?.startsWith('https://') ? href : value}
        />
      )}
    </div>
  )
}
