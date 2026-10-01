import { CopyButton } from './CopyButton'

type CopyableValueProps = {
  label: string
  value: string
}

/* A value on one line with its copy button beside it. The value wraps rather
   than truncating, so what is copied is what can be read. */
export const CopyableValue = ({ label, value }: CopyableValueProps) => (
  <div className="flex items-center justify-between gap-2 rounded-2xl border border-card-edge bg-surface-sunken py-1 pr-1 pl-3.5">
    <span className="min-w-0 font-mono text-[13px] wrap-anywhere text-neutral-ink">
      <span className="sr-only">{label}: </span>
      {value}
    </span>
    <CopyButton label={label} text={value} />
  </div>
)
