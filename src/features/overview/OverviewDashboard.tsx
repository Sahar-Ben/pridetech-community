import { ChartCard } from './ChartCard'
import { DistributionBars } from './DistributionBars'
import { DistributionTable } from './DistributionTable'
import { GenderPie } from './GenderPie'
import { IndustryNotBuiltCard } from './IndustryNotBuiltCard'
import { OverviewStats } from './OverviewStats'
import type { Overview } from './buildOverview'
import { describeCompanyCoverage, describeUnknownShare } from './overviewText'
import { SectionTitle } from '../../app/SectionTitle'

const GRID_CLASSES = 'grid grid-cols-1 gap-4 xl:grid-cols-2'

type OverviewDashboardProps = {
  overview: Overview
}

export const OverviewDashboard = ({ overview }: OverviewDashboardProps) => (
  <section className="mx-auto w-full max-w-4xl px-4 pb-12">
    <header className="pt-6 pb-4">
      <SectionTitle eyebrow="Community pulse" title="Overview" />
    </header>

    <div className="flex flex-col gap-4">
      <OverviewStats overview={overview} />

      <div className={GRID_CLASSES}>
        <ChartCard
          chart={<GenderPie distribution={overview.gender} />}
          howItWasBuilt="Read from the Gender column on the Members tab, which is filled in by hand at approval."
          provenance="counted"
          table={
            <DistributionTable
              buckets={overview.gender.buckets}
              caption="Active members by gender"
              categoryHeading="Gender"
            />
          }
          title="Gender"
          unknownNote={describeUnknownShare({
            distribution: overview.gender,
            whatIsMissing: 'have no gender recorded',
          })}
        />

        <ChartCard
          chart={
            <DistributionBars
              buckets={overview.tenure.buckets}
              chartLabel="Active members by how long ago they applied"
              unitNoun="members"
            />
          }
          howItWasBuilt="The Approved at column is empty on every row, so this dates each member from their earliest application on the Leads tab, matched on email address."
          provenance="derived"
          table={
            <DistributionTable
              buckets={overview.tenure.buckets}
              caption="Active members by time since their first application"
              categoryHeading="Time in the community"
            />
          }
          title="Time in the community"
          unknownNote={describeUnknownShare({
            distribution: overview.tenure,
            whatIsMissing: 'have no application on the Leads tab to date them from',
          })}
        />

        <ChartCard
          chart={
            <DistributionBars
              buckets={overview.companies.buckets}
              chartLabel="Active members by company"
              unitNoun="members"
            />
          }
          howItWasBuilt="Read from the Company column. Spellings that differ only in case or spacing are counted together; nothing else is merged, so Google and Google Israel stay apart."
          provenance="counted"
          table={
            <DistributionTable
              buckets={overview.companies.buckets}
              caption="Active members by company, largest ten"
              categoryHeading="Company"
            />
          }
          title="Top companies"
          unknownNote={describeCompanyCoverage(overview.companies)}
        />

        <ChartCard
          chart={
            <DistributionBars
              buckets={overview.position.buckets}
              chartLabel="Active members by discipline, guessed from their job title"
              unitNoun="members"
            />
          }
          howItWasBuilt="A guess. There is no discipline column: this reads keywords out of the free-text Title cell, and a title matching none of them is shown as unrecognised rather than dropped."
          provenance="inferred"
          table={
            <DistributionTable
              buckets={overview.position.buckets}
              caption="Active members by discipline inferred from their job title"
              categoryHeading="Discipline"
            />
          }
          title="Discipline"
          unknownNote={describeUnknownShare({
            distribution: overview.position,
            whatIsMissing: 'have no title recorded, or a title these rules did not recognise',
          })}
        />

        <ChartCard
          chart={
            <DistributionBars
              buckets={overview.seniority.buckets}
              chartLabel="Active members by seniority, guessed from their job title"
              unitNoun="members"
            />
          }
          howItWasBuilt="A guess, and the weaker of the two: most job titles state no level at all, and those members are counted as stating none rather than as junior."
          provenance="inferred"
          table={
            <DistributionTable
              buckets={overview.seniority.buckets}
              caption="Active members by seniority inferred from their job title"
              categoryHeading="Seniority"
            />
          }
          title="Seniority"
          unknownNote={describeUnknownShare({
            distribution: overview.seniority,
            whatIsMissing: 'have a title that states no level, or no title at all',
          })}
        />

        <IndustryNotBuiltCard />
      </div>
    </div>
  </section>
)
