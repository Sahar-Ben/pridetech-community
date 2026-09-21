import { StatTile } from './StatTile'
import type { Overview } from './buildOverview'
import { GLASS_PANEL_CLASSES } from '../../theme/surfaces'

const PANEL_CLASSES = `${GLASS_PANEL_CLASSES} animate-rise flex flex-wrap gap-x-10 gap-y-5 px-5 py-4`

type OverviewStatsProps = {
  overview: Overview
}

/* Four numbers rather than four one-bar charts. The distinct-company figure
   carries its own caveat where it is read: it counts how many different
   spellings of a company name are on the sheet, and `Google` and `Google
   Israel` are two of those whether or not they are two employers. */
export const OverviewStats = ({ overview }: OverviewStatsProps) => (
  <dl className={PANEL_CLASSES}>
    <StatTile label="Active members" value={overview.memberCount} />
    <StatTile label="Ex-members" note="Not counted in any chart below" value={overview.exMemberCount} />
    <StatTile
      label="Companies"
      note="Distinct spellings on the sheet, not verified employers"
      value={overview.companies.distinctCompanyCount}
    />
    <StatTile
      label="Members with no company recorded"
      value={overview.companies.membersWithoutCompanyCount}
    />
  </dl>
)
