import { containsAnyKeyword, toTitleWords } from './titleWords'

export type TitleCategory = {
  key: string
  label: string
}

/* Guesswork, and labelled as guesswork wherever it reaches the screen. The
   sheet has no position column; this reads keywords out of a free-text `Title`
   that people wrote for their own reasons.

   ORDER IS THE RULE. The first category with a matching keyword wins, so the
   list runs from the most specific discipline to the most general: `Data
   Engineer` has to reach Data before it reaches Engineering, and `UX
   Researcher` has to reach Design before it reaches Research. Moving a row
   moves people between charts, so move one only on purpose. */
export const POSITION_CATEGORIES: readonly (TitleCategory & { keywords: readonly string[] })[] = [
  {
    key: 'founder-and-general-management',
    label: 'Founder / general management',
    keywords: [
      'founder',
      'ceo',
      'coo',
      'owner',
      'entrepreneur',
      'general manager',
      'managing director',
    ],
  },
  {
    key: 'security',
    label: 'Security',
    keywords: [
      'security',
      'infosec',
      'appsec',
      'cyber',
      'ciso',
      'penetration',
      'pentest',
      'pentester',
    ],
  },
  {
    key: 'data-and-analytics',
    label: 'Data & analytics',
    keywords: [
      'data',
      'analytics',
      'analyst',
      'bi',
      'business intelligence',
      'machine learning',
      'ml',
      'ai',
      'nlp',
      'statistician',
    ],
  },
  {
    key: 'design',
    label: 'Design',
    keywords: [
      'design',
      'designer',
      'ux',
      'ui',
      'user experience',
      'artist',
      'illustrator',
      'animator',
      'creative',
    ],
  },
  {
    key: 'research',
    label: 'Research',
    keywords: ['research', 'researcher', 'scientist', 'phd', 'postdoc'],
  },
  {
    key: 'product',
    label: 'Product',
    keywords: ['product', 'cpo'],
  },
  {
    key: 'quality-and-testing',
    label: 'Quality & testing',
    keywords: ['qa', 'quality assurance', 'tester', 'testing', 'sdet', 'automation'],
  },
  {
    key: 'engineering',
    label: 'Engineering',
    keywords: [
      'engineer',
      'engineering',
      'developer',
      'development',
      'programmer',
      'devops',
      'sre',
      'site reliability',
      'architect',
      'backend',
      'frontend',
      'fullstack',
      'full stack',
      'mobile',
      'ios',
      'android',
      'software',
      'cto',
      'r&d',
      'infrastructure',
      'platform',
      'embedded',
    ],
  },
  {
    key: 'it-and-support',
    label: 'IT & support',
    keywords: [
      'it',
      'support',
      'helpdesk',
      'help desk',
      'sysadmin',
      'system administrator',
      'technician',
    ],
  },
  {
    key: 'marketing-and-content',
    label: 'Marketing & content',
    keywords: [
      'marketing',
      'cmo',
      'content',
      'brand',
      'communications',
      'seo',
      'sem',
      'growth',
      'copywriter',
      'copywriting',
      'social media',
      'public relations',
      'community',
    ],
  },
  {
    key: 'sales-and-customer',
    label: 'Sales & customer',
    keywords: [
      'sales',
      'account executive',
      'account manager',
      'customer success',
      'business development',
      'partnerships',
      'revenue',
      'presales',
    ],
  },
  {
    key: 'people-and-hr',
    label: 'People & HR',
    keywords: [
      'hr',
      'human resources',
      'people',
      'talent',
      'recruiter',
      'recruitment',
      'recruiting',
      'sourcer',
      'l&d',
      'employee experience',
    ],
  },
  {
    key: 'finance-and-legal',
    label: 'Finance & legal',
    keywords: [
      'finance',
      'financial',
      'accountant',
      'accounting',
      'controller',
      'cfo',
      'bookkeeper',
      'payroll',
      'legal',
      'counsel',
      'lawyer',
      'compliance',
      'tax',
      'audit',
      'auditor',
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    keywords: [
      'operations',
      'operational',
      'ops',
      'logistics',
      'procurement',
      'project manager',
      'program manager',
      'pmo',
      'chief of staff',
      'office manager',
      'administration',
      'executive assistant',
      'supply chain',
    ],
  },
]

/* Two different absences, and collapsing them would hide which one the sheet
   has: a member with no title at all is a gap in the data, and a title no rule
   recognised is a gap in these rules. */
export const NO_TITLE_POSITION: TitleCategory = {
  key: 'no-title',
  label: 'No title recorded',
}

export const UNCLASSIFIED_POSITION: TitleCategory = {
  key: 'unclassified-position',
  label: 'Title not recognised',
}

export const classifyPosition = (title: string | undefined): TitleCategory => {
  const words = toTitleWords(title)
  if (words.length === 0) {
    return NO_TITLE_POSITION
  }
  const category = POSITION_CATEGORIES.find((candidate) =>
    containsAnyKeyword({ words, keywords: candidate.keywords }),
  )
  if (category === undefined) {
    return UNCLASSIFIED_POSITION
  }
  return { key: category.key, label: category.label }
}
