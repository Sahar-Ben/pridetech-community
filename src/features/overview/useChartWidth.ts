import { useEffect, useState } from 'react'

/* Wide enough to lay a chart out when nothing has measured yet, which is every
   render in jsdom: `ResizeObserver` does not exist there, and a chart that
   threw or collapsed without it would take the whole dashboard's tests with
   it. */
const UNMEASURED_WIDTH = 480

const NARROWEST_CHART = 240

export const useChartWidth = (): {
  measureElement: (element: HTMLDivElement | null) => void
  chartWidth: number
} => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(UNMEASURED_WIDTH)

  useEffect(() => {
    if (element === null || typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0
      if (measured > 0) {
        setChartWidth(Math.max(NARROWEST_CHART, measured))
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element])

  return { measureElement: setElement, chartWidth }
}
