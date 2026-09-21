import type { TitleCategory } from './classifyPosition'
import { containsAnyKeyword, toTitleWords } from './titleWords'

/* The same guesswork as the position rules, with one extra trap of its own:
   `manager` in a job title means a rung on a ladder about half the time and a
   thing somebody looks after the other half, and `Product Manager` is not a
   manager. `IC_MANAGER_PREFIXES` is the list of words that turn the second
   reading on; the rung is only claimed when at least one `manager` in the title
   is not preceded by one of them.

   ORDER IS THE RULE, and here it means the highest rung named in a title wins:
   `Senior Engineering Manager` is a manager, not a senior. */
export const SENIORITY_LEVELS: readonly (TitleCategory & { keywords: readonly string[] })[] = [
  {
    key: 'executive',
    label: 'Executive (C-level, VP, founder)',
    keywords: [
      'chief',
      'ceo',
      'cto',
      'cfo',
      'coo',
      'cmo',
      'cpo',
      'ciso',
      'cro',
      'founder',
      'president',
      'vice president',
      'vp',
      'svp',
      'evp',
      'managing director',
      'owner',
      'partner',
    ],
  },
  {
    key: 'director',
    label: 'Director / head of',
    keywords: ['director', 'head of', 'head'],
  },
  {
    key: 'manager',
    label: 'Manager',
    keywords: ['manager'],
  },
  {
    key: 'lead',
    label: 'Lead / Staff / Principal',
    keywords: ['lead', 'principal', 'staff'],
  },
  {
    key: 'senior',
    label: 'Senior',
    keywords: ['senior', 'sr', 'snr'],
  },
  {
    key: 'junior',
    label: 'Junior / entry level',
    keywords: ['junior', 'jr', 'intern', 'trainee', 'apprentice', 'entry level', 'student'],
  },
]

const IC_MANAGER_PREFIXES: readonly string[] = [
  'product',
  'program',
  'project',
  'account',
  'community',
  'marketing',
  'content',
  'brand',
  'customer',
  'success',
  'office',
  'case',
  'clinical',
  'data',
  'social',
  'campaign',
  'category',
  'delivery',
  'partner',
]

export const NO_TITLE_SENIORITY: TitleCategory = {
  key: 'no-title',
  label: 'No title recorded',
}

export const NO_LEVEL_SENIORITY: TitleCategory = {
  key: 'no-level-stated',
  label: 'No level stated in title',
}

const doesTitleNameAPeopleManager = (words: readonly string[]): boolean =>
  words.some(
    (word, index) =>
      word === 'manager' && !IC_MANAGER_PREFIXES.includes(words[index - 1] ?? ''),
  )

const doesTitleReach = ({
  words,
  level,
}: {
  words: readonly string[]
  level: TitleCategory & { keywords: readonly string[] }
}): boolean => {
  if (level.key === 'manager') {
    return doesTitleNameAPeopleManager(words)
  }
  return containsAnyKeyword({ words, keywords: level.keywords })
}

export const classifySeniority = (title: string | undefined): TitleCategory => {
  const words = toTitleWords(title)
  if (words.length === 0) {
    return NO_TITLE_SENIORITY
  }
  const level = SENIORITY_LEVELS.find((candidate) => doesTitleReach({ words, level: candidate }))
  if (level === undefined) {
    return NO_LEVEL_SENIORITY
  }
  return { key: level.key, label: level.label }
}
