import {
  ATTENDANCE_HEADINGS,
  ATTENDANCE_TAB_NAME,
  EVENT_SHEETS_HEADINGS,
  EVENT_SHEETS_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
} from '../../src/features/events/eventRegistryTabs'
import { LINKEDIN_CASES } from './linkedInCases'
import { LEADS_HEADER_ROW, MEMBERS_HEADER_ROW } from '../../src/testing/sheetsClientFactory'

/* Data chosen to break layouts, not to look real: the longest unbroken
   strings a form will accept, Hebrew, every shape of LinkedIn cell seen in the
   sheet, blanks, duplicates, and enough rows to scroll. Every name, address and
   number here is invented. */

const FIRST = [
  'Noa',
  'Yoni',
  'Maya',
  'Dana',
  'Amit',
  'Ariel',
  'Bar',
  'Eden',
  'Tal',
  'Shir',
  'Omer',
  'Lior',
]
const LAST = [
  'Levi',
  'Shapiro',
  'Rosen',
  'Peretz',
  'Katz',
  'Shani',
  'Cohen',
  'Mor',
  'Azulai',
  'Golan',
]

export const LONG_NAME = 'Alexandria-Konstantina Bartholomew-Featherstonehaugh-Montgomery'
export const HEBREW_NAME = 'דנה כהן-לוי'
export const LONG_EMAIL =
  'averyveryveryveryveryverylongemailaddresswithoutanybreaks@subdomain.example-company-name.co.il'
export const LONG_COMPANY =
  'International Consolidated Enterprise Cloud Infrastructure Solutions Holdings Ltd'
export const LONG_TITLE =
  'Principal Senior Staff Escalation Manager and Customer Support Operations Lead (EMEA, APAC)'
export const LONG_INTERESTS =
  'AI, Product, Innovation, Leadership / Management, Sales, SaaS, Cyber, Cloud, Investments / Founding, UX/UI'
export const LONG_CITY = 'Kiryat Shmona and the Upper Galilee Regional Council'
/* No spaces at all, so nothing can wrap it except an explicit rule. */
export const UNBROKEN_TEXT =
  'https://www.some-company-website-that-someone-pasted.example.com/careers/position/1234567890'

const nameAt = (index: number): string =>
  `${FIRST[index % FIRST.length] ?? 'Noa'} ${LAST[(index * 7) % LAST.length] ?? 'Levi'}`

const stamp = (index: number): string => `${(index % 9) + 1}/${(index % 27) + 1}/2026 10:00:00`

/* The Leads tab's columns, in order: timestamp, name, title, company,
   LinkedIn, email, phone, city, interests, shirt size, status. */
const leadRow = (cells: {
  index: number
  name?: string
  title?: string
  company?: string
  linkedIn?: string
  email?: string
  phone?: string
  city?: string
  interests?: string
  status?: string
}): string[] => [
  stamp(cells.index),
  cells.name ?? nameAt(cells.index + 40),
  cells.title ?? 'Product Designer',
  cells.company ?? ['Lumen Labs', 'Orbit Cloud', 'Kite Health', 'Northwind'][cells.index % 4] ?? '',
  cells.linkedIn ?? 'https://www.linkedin.com/in/example',
  cells.email ?? `lead${cells.index}@example.com`,
  cells.phone ?? '050-123-4567',
  cells.city ?? ['Tel Aviv', 'Haifa', 'Jerusalem', 'Ramat Gan'][cells.index % 4] ?? '',
  cells.interests ?? 'AI, Product',
  'M',
  cells.status ?? '',
]

const TRICKY_LEADS: readonly string[][] = [
  leadRow({
    index: 900,
    name: LONG_NAME,
    title: LONG_TITLE,
    company: LONG_COMPANY,
    email: LONG_EMAIL,
    city: LONG_CITY,
    interests: LONG_INTERESTS,
    phone: '+972 (0)50-123-4567 ext. 1234 (evenings only please)',
  }),
  leadRow({
    index: 905,
    name: 'UnbrokenNameWithoutAnySpacesAtAllBecauseTheFormAllowsIt',
    title: UNBROKEN_TEXT,
    company: UNBROKEN_TEXT,
    city: 'Tel-Aviv-Yafo-Jaffa-Neve-Tzedek-Florentin-Kerem-HaTeimanim',
    interests: 'SuperLongInterestWithoutSpaces-AI-Product-Innovation-Leadership',
  }),
  leadRow({
    index: 901,
    name: HEBREW_NAME,
    title: 'מנהלת מוצר',
    company: 'חברה בע"מ',
    city: 'תל אביב',
  }),
  leadRow({ index: 902, name: '', email: 'no-name-given@example.com' }),
  leadRow({ index: 903, linkedIn: '', phone: '', city: '', interests: '' }),
  leadRow({ index: 904, linkedIn: 'will send it later' }),
  ...LINKEDIN_CASES.map((linkedInCase, offset) =>
    leadRow({
      index: 910 + offset,
      name: `LinkedIn Case ${offset + 1}`,
      linkedIn: linkedInCase.cell,
    }),
  ),
  leadRow({ index: 920, name: 'Twice Applied', email: 'twice@example.com' }),
  leadRow({ index: 921, name: 'Twice Applied', email: 'twice@example.com' }),
  leadRow({ index: 930, name: 'Kept For Later', status: 'Maybe in the future' }),
  leadRow({ index: 931, name: 'Already Declined', status: 'Declined' }),
]

const PLAIN_LEADS = Array.from({ length: 40 }, (_unused, index) => leadRow({ index }))

/* The Members tab's columns, in order: name, company, title, gender, mail,
   informed, meetup, phone, city, LinkedIn, interests, shirt, notes, status,
   removal reason, approved at, previous removal reason, rejoined at. */
const memberRow = (cells: {
  name: string
  company?: string
  title?: string
  gender?: string
  mail?: string
  city?: string
  linkedIn?: string
  status?: string
}): string[] => [
  cells.name,
  cells.company ?? 'Meadowlark Labs',
  cells.title ?? 'Backend Engineer',
  cells.gender ?? 'M',
  cells.mail ?? `${cells.name.toLowerCase().replace(/\W+/g, '.')}@example.com`,
  'Yes',
  '1st',
  '050-000-0000',
  cells.city ?? 'Tel Aviv',
  cells.linkedIn ?? '',
  'AI',
  'M',
  '',
  cells.status ?? 'Active',
  cells.status === 'Ex-member' ? 'Moved abroad' : '',
  '2024-01-01',
  '',
  '',
]

const MEMBERS: readonly string[][] = [
  memberRow({
    name: LONG_NAME,
    company: LONG_COMPANY,
    title: LONG_TITLE,
    mail: LONG_EMAIL,
    city: LONG_CITY,
    gender: 'F',
    linkedIn: 'www.linkedin.com/in/member-without-scheme',
  }),
  memberRow({ name: HEBREW_NAME, company: 'חברה בע"מ', gender: 'F' }),
  memberRow({
    name: 'UnbrokenMemberNameWithoutAnySpacesAtAll',
    company: UNBROKEN_TEXT,
    title: UNBROKEN_TEXT,
  }),
  memberRow({ name: 'Former Member', status: 'Ex-member' }),
  /* A member who also applied, so the queue has someone to leave out. */
  memberRow({ name: 'Twice Applied Member', mail: 'lead5@example.com' }),
  ...Array.from({ length: 80 }, (_unused, index) =>
    memberRow({ name: nameAt(index), gender: index % 5 === 0 ? 'F' : index % 13 === 0 ? '' : 'M' }),
  ),
]

const EVENTS: readonly string[][] = [
  [
    'evt-1',
    'Pride Month Panel',
    '2026-06-24',
    'Northwind',
    'Northwind auditorium, Herzliya',
    '',
    'Yes',
    'No',
    'No',
    '',
  ],
  [
    'evt-2',
    'An Extremely Long Event Name That Somebody Typed Without Thinking About Phones At All',
    '2026-10-20',
    LONG_COMPANY,
    `${LONG_CITY}, Building 4, Floor 12, the room at the end of the corridor`,
    '',
    'No',
    'No',
    'No',
    '',
  ],
  [
    'evt-4',
    'UnbrokenEventNameWithoutSpacesAnywhereInIt',
    '2026-12-01',
    UNBROKEN_TEXT,
    UNBROKEN_TEXT,
    '',
    'No',
    'No',
    'No',
    '',
  ],
  ['evt-3', 'Moabet', '2026-11-14', '', '', '', 'No', 'No', 'No', ''],
]

export const HARNESS_TABS = {
  Leads: [LEADS_HEADER_ROW, ...PLAIN_LEADS, ...TRICKY_LEADS],
  Members: [MEMBERS_HEADER_ROW, ...MEMBERS],
  [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS], ...EVENTS],
  [EVENT_SHEETS_TAB_NAME]: [[...EVENT_SHEETS_HEADINGS]],
  [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]],
}
