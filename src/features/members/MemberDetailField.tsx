import { EmptyValue } from './EmptyValue'

const LINK_CLASSES =
  'text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300'

type MemberDetailFieldProps = {
  label: string
  value: string | undefined
  href?: string
}

export const MemberDetailField = ({ label, value, href }: MemberDetailFieldProps) => {
  const doesOpenInNewTab = href !== undefined && href.startsWith('https://')

  return (
    <div className="border-t border-slate-200 py-2 dark:border-slate-800">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-slate-900 dark:text-slate-100">
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
