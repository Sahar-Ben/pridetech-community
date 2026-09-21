const WIDEST_LABEL_COLUMN = 180
const LABEL_COLUMN_SHARE = 0.38
const VALUE_COLUMN_WIDTH = 40
const CHARACTER_WIDTH = 6.2

export type BarChartLayout = {
  labelColumnWidth: number
  trackLength: number
  valueColumnWidth: number
  labelCharacterBudget: number
}

/* The chart is drawn at the width it is actually given, in CSS pixels, so its
   text is 11px on a phone and 11px on a laptop. A fixed viewBox stretched to
   fit would scale the type with the box and put eight-pixel labels on the one
   screen most likely to be read standing at a door. */
export const toBarChartLayout = (chartWidth: number): BarChartLayout => {
  const labelColumnWidth = Math.round(Math.min(WIDEST_LABEL_COLUMN, chartWidth * LABEL_COLUMN_SHARE))
  const valueColumnWidth = Math.min(VALUE_COLUMN_WIDTH, Math.round(chartWidth * 0.1))

  return {
    labelColumnWidth,
    valueColumnWidth,
    trackLength: chartWidth - labelColumnWidth - valueColumnWidth,
    labelCharacterBudget: Math.max(6, Math.floor((labelColumnWidth - 10) / CHARACTER_WIDTH)),
  }
}
