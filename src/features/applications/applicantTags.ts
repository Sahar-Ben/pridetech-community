/* The interests cell is one free-text answer to a multi-select question, so it
   arrives as `AI, Product, Leadership / Management`. The card shows the first
   few as chips and counts the rest, so a long answer cannot push the decision
   buttons off a phone screen. */
export const VISIBLE_INTEREST_COUNT = 3

export const splitInterests = (interests: string | undefined): readonly string[] =>
  (interests ?? '')
    .split(',')
    .map((interest) => interest.trim())
    .filter((interest) => interest !== '')

export const summariseInterests = (
  interests: string | undefined,
): { shown: readonly string[]; hiddenCount: number } => {
  const all = splitInterests(interests)
  return {
    shown: all.slice(0, VISIBLE_INTEREST_COUNT),
    hiddenCount: Math.max(0, all.length - VISIBLE_INTEREST_COUNT),
  }
}
