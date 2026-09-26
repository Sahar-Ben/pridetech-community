import { REGISTRY_TAB_DEFINITIONS } from './eventRegistryTabs'
import {
  selectTabsToCreate,
  type RegistryTabPlan,
  type RegistryTabPlans,
} from './registrySetupPlan'

const NOTHING_ELSE = 'Nothing else in the spreadsheet is read, moved or changed.'

const countTabs = (count: number): string => `${count} ${count === 1 ? 'tab' : 'tabs'}`

const describeHolding = (tabName: string): string =>
  REGISTRY_TAB_DEFINITIONS.find((definition) => definition.tabName === tabName)?.holds ?? ''

const selectEmptyTabs = (plans: RegistryTabPlans): readonly string[] =>
  plans.flatMap((plan) => (plan.state === 'empty' ? [plan.tabName] : []))

/* Adding a tab and filling in the headings of a tab somebody already made are
   different sizes of thing, and the organiser has already made all three by
   hand. One sentence covering both would have to be vague enough to be wrong
   about whichever one is actually happening. */
export const describeRegistrySetupAction = (plans: RegistryTabPlans): string => {
  const createdCount = selectTabsToCreate(plans).length
  const filledCount = selectEmptyTabs(plans).length

  if (createdCount > 0 && filledCount > 0) {
    return `This will add ${countTabs(createdCount)} to your spreadsheet, and write a heading row into ${countTabs(filledCount)} that are already there and empty. ${NOTHING_ELSE}`
  }
  if (createdCount > 0) {
    return `This will add ${countTabs(createdCount)} to your spreadsheet, each with a heading row. ${NOTHING_ELSE}`
  }
  return `${countTabs(filledCount)} are already there and empty. This will write a heading row into each of them, and nothing else. ${NOTHING_ELSE}`
}

export const describeRegistryTabPlan = (plan: RegistryTabPlan): string => {
  if (plan.state === 'unusable') {
    return plan.reason
  }
  if (plan.state === 'ready') {
    return `${plan.tabName} is already set up. Nothing will be changed in it.`
  }
  if (plan.state === 'empty') {
    return `${plan.tabName} is already there and completely empty. Its heading row will be written: ${describeHolding(plan.tabName)}.`
  }
  return `${plan.tabName} is not there. It will be added, with its heading row: ${describeHolding(plan.tabName)}.`
}
