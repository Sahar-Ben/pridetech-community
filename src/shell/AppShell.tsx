import { useEffect, useRef, type ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { BrandMark } from './BrandMark'
import { SectionNav } from './SectionNav'
import type { Section } from './section'
import type { WorkspaceAccount } from './workspaceAccount'

/* The page itself never scrolls: the shell fills the screen and only `main`
   scrolls, between a header that sits at the top and a nav that floats at the
   bottom. On an iPhone a scrolling page can be left offset after the keyboard
   closes or the browser bars collapse mid-swipe, and everything pinned to the
   screen -- the header and the nav -- slides up with it and stays there.
   Nothing here is pinned to a page that can be left out of place. */
const ROOT_CLASSES = 'fixed inset-0 flex flex-col overflow-hidden bg-ground text-on-brand'

const HEADER_CLASSES = 'z-30 shrink-0 bg-ground pt-[env(safe-area-inset-top)]'

/* The bottom padding keeps the last card clear of the floating nav on a phone; from `md`
   up the nav is a rail, so the content steps right by its width instead and
   the matching right padding at `xl` keeps the column centred on the page.
   `overscroll-contain` stops a fling at the end of the list from bouncing the
   whole screen. */
const MAIN_CLASSES = [
  'min-h-0 grow overflow-y-auto overscroll-contain',
  'pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-12 md:pl-60 xl:pr-60',
].join(' ')

type AppShellProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  account: WorkspaceAccount
  leadsWaitingCount?: number
  children: ReactNode
}

export const AppShell = ({
  activeSection,
  onSelectSection,
  account,
  leadsWaitingCount,
  children,
}: AppShellProps) => {
  const mainRef = useRef<HTMLElement>(null)

  /* A new section opens at its top, not at the depth the last one was left. */
  useEffect(() => {
    if (mainRef.current !== null) {
      mainRef.current.scrollTop = 0
    }
  }, [activeSection])

  /* Belt and braces for iOS: if closing the keyboard leaves the window itself
     panned -- it can pan even a page that does not scroll -- put it back once
     focus has left the field. */
  useEffect(() => {
    const settleWindow = () => {
      window.setTimeout(() => {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0)
        }
      }, 50)
    }
    document.addEventListener('focusout', settleWindow)
    return () => {
      document.removeEventListener('focusout', settleWindow)
    }
  }, [])

  return (
    <div className={ROOT_CLASSES}>
      <header className={HEADER_CLASSES}>
        <div className="mx-auto flex w-full items-center justify-between px-5 pt-5 pb-4 md:px-6">
          <BrandMark as="h1" />
          <AccountMenu account={account} />
        </div>
        <div aria-hidden="true" className="rainbow-rule mx-5 md:mx-6" />
      </header>

      <main className={MAIN_CLASSES} ref={mainRef}>
        {children}
      </main>

      <SectionNav
        activeSection={activeSection}
        leadsWaitingCount={leadsWaitingCount}
        onSelectSection={onSelectSection}
      />
    </div>
  )
}
