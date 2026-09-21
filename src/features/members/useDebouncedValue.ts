import { useEffect, useState } from 'react'

/* The directory filters 787 people, and filtering them on every keystroke is
   work nobody sees: the letters arrive faster than anyone can read a list.
   Only the pause at the end of a word is worth rendering, so the input stays
   the fast thing and the table follows it. */
export const useDebouncedValue = <TValue,>({
  value,
  delayInMilliseconds,
}: {
  value: TValue
  delayInMilliseconds: number
}): TValue => {
  const [settledValue, setSettledValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettledValue(value)
    }, delayInMilliseconds)
    return () => {
      clearTimeout(timer)
    }
  }, [delayInMilliseconds, value])

  return settledValue
}
