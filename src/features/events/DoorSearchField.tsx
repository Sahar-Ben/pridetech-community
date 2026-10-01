import { useId, type RefObject } from 'react'

/* Bigger text and a heavier border than the rest of the app: this is typed
   one-handed, at arm's length, in whatever light the venue has. Opaque fill
   and a 3:1 edge on both themes, because a translucent field at a dark door
   is a field you cannot find. */
const INPUT_CLASSES = [
  'w-full min-h-14 rounded-2xl border-2 border-edge bg-surface px-4 py-3',
  'text-lg text-ink transition-[border-color] duration-150 ease-brand focus:border-accent',
].join(' ')

type DoorSearchFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export const DoorSearchField = ({ label, value, onChange, inputRef }: DoorSearchFieldProps) => {
  const inputId = useId()

  return (
    <div className="flex flex-col gap-1">
      <label
        className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase"
        htmlFor={inputId}
      >
        {label}
      </label>
      <input
        autoComplete="off"
        className={INPUT_CLASSES}
        id={inputId}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        ref={inputRef}
        type="search"
        value={value}
      />
    </div>
  )
}
