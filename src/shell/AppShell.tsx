import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SidebarNav } from './SidebarNav'
import type { Section } from './section'

const BURGER_GLYPH = '\u{2630}'

/* The rail is fixed, so `md:pl-56` reserves the width it covers. The matching
   right padding from `xl` up is what keeps the content column centred on the
   viewport instead of centred in the space left beside the rail. */
const MAIN_CLASSES = 'md:pl-56 xl:pr-56'

type AppShellProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  children: ReactNode
}

export const AppShell = ({ activeSection, onSelectSection, children }: AppShellProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    burgerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }
    navRef.current?.focus()
  }, [isDrawerOpen])

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeDrawer, isDrawerOpen])

  const selectSection = (section: Section) => {
    onSelectSection(section)
    if (isDrawerOpen) {
      closeDrawer()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className={MAIN_CLASSES}>
        <div className="flex justify-start px-4 pt-4 md:hidden">
          <button
            aria-expanded={isDrawerOpen}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setIsDrawerOpen(true)}
            ref={burgerRef}
            type="button"
          >
            <span aria-hidden="true">{BURGER_GLYPH}</span>
            <span className="sr-only">Menu</span>
          </button>
        </div>
        {children}
      </main>

      {isDrawerOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={closeDrawer}
          type="button"
        />
      )}

      <SidebarNav
        activeSection={activeSection}
        isOpen={isDrawerOpen}
        onSelectSection={selectSection}
        ref={navRef}
      />
    </div>
  )
}
