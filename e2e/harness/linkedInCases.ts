/* Kept apart from the rest of the fixtures because the specs import it too,
   and the fixtures pull in test helpers that only run under vitest. */
/* Every LinkedIn shape the form has produced, with the address it must open. */
export const LINKEDIN_CASES: ReadonlyArray<{ cell: string; opens: string }> = [
  {
    cell: 'https://www.linkedin.com/in/full-address',
    opens: 'https://www.linkedin.com/in/full-address',
  },
  { cell: 'linkedin.com/in/no-scheme', opens: 'https://linkedin.com/in/no-scheme' },
  { cell: 'www.linkedin.com/in/www-only', opens: 'https://www.linkedin.com/in/www-only' },
  { cell: 'il.linkedin.com/in/country-host', opens: 'https://il.linkedin.com/in/country-host' },
  { cell: 'in/path-only', opens: 'https://www.linkedin.com/in/path-only' },
  { cell: 'bare-handle', opens: 'https://www.linkedin.com/in/bare-handle' },
  {
    cell: 'My profile: https://www.linkedin.com/in/in-a-sentence.',
    opens: 'https://www.linkedin.com/in/in-a-sentence',
  },
]
