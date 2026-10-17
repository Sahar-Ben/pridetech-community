import { useEffect, useRef, useState } from 'react'
import type { MemberEmailList } from './memberEmailList'
import { copyText } from '../../app/clipboard'
import { SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const COPIED_FOR_MS = 2200

const BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} min-h-11 px-4 text-sm`

const pluralise = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`

type CopyEmailsButtonProps = {
  list: MemberEmailList
}

/* The addresses of exactly the members on screen, ready to paste into Gmail.
   Bcc is suggested beside it because a paste into To shows every member every
   other member's address. */
export const CopyEmailsButton = ({ list }: CopyEmailsButtonProps) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async () => {
    const didCopy = await copyText(list.text)
    setState(didCopy ? 'copied' : 'failed')
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setState('idle'), COPIED_FOR_MS)
  }

  const emails = pluralise(list.emailCount, 'email', 'emails')

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        className={`${BUTTON_CLASSES} ${state === 'copied' ? 'border-success-edge text-success-ink' : ''}`}
        disabled={list.emailCount === 0}
        onClick={() => {
          void copy()
        }}
        type="button"
      >
        <span aria-live="polite">
          {state === 'copied' && `Copied ${emails}`}
          {state === 'failed' && 'Could not copy. Try again'}
          {state === 'idle' && `Copy ${emails}`}
        </span>
      </button>
      <span className="text-xs text-ink-muted">
        Paste into Gmail&apos;s Bcc, so members do not see each other&apos;s addresses.
        {list.withoutEmailCount > 0 &&
          ` ${pluralise(list.withoutEmailCount, 'member', 'members')} on this list ${
            list.withoutEmailCount === 1 ? 'has' : 'have'
          } no email.`}
        {list.repeatedCount > 0 &&
          ` ${pluralise(list.repeatedCount, 'row repeats', 'rows repeat')} an address already on the list, copied once.`}
      </span>
    </div>
  )
}
