import type { ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { BrandMark } from './BrandMark'
import { SectionNav } from './SectionNav'
import type { Section } from './section'
import type { WorkspaceAccount } from './workspaceAccount'

/* `pb-32` keeps the last card clear of the floating nav on a phone; from `md`
   up the nav is a rail, so the content steps right by its width instead and
   the matching right padding at `xl` keeps the column centred on the page. */
const MAIN_CLASSES = 'pb-32 md:pb-12 md:pl-60 xl:pr-60'

type AppShellProps = {
  activeSection: Section
  onSelectSection: (section: Section) => void
  account: WorkspaceAccount
  children: ReactNode
}

export const AppShell = ({ activeSection, onSelectSection, account, children }: AppShellProps) => (
  <div className="min-h-dvh bg-ground text-on-brand">
    <header className="sticky top-0 z-30 bg-ground/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex w-full items-center justify-between px-5 pt-5 pb-4 md:px-6">
        <BrandMark as="h1" />
        <AccountMenu account={account} />
      </div>
      <div aria-hidden="true" className="rainbow-rule mx-5 md:mx-6" />
    </header>

    <main className={MAIN_CLASSES}>{children}</main>

    <SectionNav activeSection={activeSection} onSelectSection={onSelectSection} />
  </div>
)
