import { StatTile } from './StatTile'
import type { Overview } from './buildOverview'

/* Four equal columns rather than a wrapping row, so no number drops onto a
   second line on its own and every tile is the width of every other. */
const GRID_CLASSES = 'animate-rise grid grid-cols-2 gap-4 sm:grid-cols-4'

type OverviewStatsProps = {
  overview: Overview
}

/* Four numbers rather than four one-bar charts. The distinct-company figure
   carries its own caveat where it is read: it counts how many different
   spellings of a company name are on the sheet, and `Google` and `Google
   Israel` are two of those whether or not they are two employers. */
export const OverviewStats = ({ overview }: OverviewStatsProps) => (
  <dl className={GRID_CLASSES}>
    <StatTile label="Active members" value={overview.memberCount} />
    <StatTile label="Ex-members" note="Not counted in any chart below" value={overview.exMemberCount} />
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
  </dl>
)
