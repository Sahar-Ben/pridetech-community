import { StatTile } from './StatTile'
import type { Overview } from './buildOverview'

/* Four equal columns rather than a wrapping row, so no number drops onto a
   second line on its own and every tile is the width of every other. */
const GRID_CLASSES = 'animate-rise grid grid-cols-2 gap-3'

type OverviewStatsProps = {
  overview: Overview
}

/* The headline number across the row, with the ex-members it leaves out said
   under it, then four tiles: two about the members, two about the queue. Numbers rather than one-bar charts. The distinct-company figure
   carries its own caveat where it is read: it counts how many different
   spellings of a company name are on the sheet, and `Google` and `Google
   Israel` are two of those whether or not they are two employers. */
export const OverviewStats = ({ overview }: OverviewStatsProps) => (
  <dl className={GRID_CLASSES}>
    <StatTile
      featured
      label="Active members"
      note={`${(overview.memberCount + overview.exMemberCount).toLocaleString('en-US')} total · ${overview.exMemberCount.toLocaleString('en-US')} ex-members, not counted in any chart below`}
      value={overview.memberCount}
    />
    <StatTile
      label="Companies"
      note="Distinct spellings on the sheet, not verified employers"
      value={overview.companies.distinctCompanyCount}
    />
    <StatTile
      label="No company"
      note="Members with the Company cell empty"
      value={overview.companies.membersWithoutCompanyCount}
    />
    <StatTile
      label="Pending leads"
      note="Waiting for review on the Leads tab"
      tone="accent"
      value={overview.applications.waitingCount}
    />
    <StatTile
      label="Duplicate emails"
      note="Addresses on more than one application"
      tone="warning"
      value={overview.applications.repeatedLeadEmailCount}
    />
  </dl>
)
