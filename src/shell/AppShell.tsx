import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SidebarNav } from './SidebarNav'
import type { Section } from './section'
import { SHELL_BUTTON_CLASSES } from '../theme/controls'

const BURGER_GLYPH = '\u{2630}'

/* The rail is fixed, so `md:pl-60` reserves the width it covers. The matching
   right padding from `xl` up is what keeps the content column centred on the
   viewport instead of centred in the space left beside the rail. */
const MAIN_CLASSES = 'md:pl-60 xl:pr-60'

const BURGER_CLASSES = `${SHELL_BUTTON_CLASSES} px-4 py-2 text-base`

const SCRIM_CLASSES = [
  'fixed inset-0 z-30 bg-[rgb(9_6_24/0.55)] backdrop-blur-sm md:hidden',
  'animate-fade',
].join(' ')

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
    <div className="min-h-dvh text-on-brand">
      <main className={MAIN_CLASSES}>
        <div className="flex justify-start px-4 pt-4 md:hidden">
          <button
            aria-expanded={isDrawerOpen}
            className={BURGER_CLASSES}
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
          className={SCRIM_CLASSES}
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
