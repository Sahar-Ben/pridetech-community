import { useId, type RefObject } from 'react'

/* Bigger text and a heavier border than the rest of the app: this is typed
   one-handed, at arm's length, in whatever light the venue has. */
const INPUT_CLASSES =
  'w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

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
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={inputId}>
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
