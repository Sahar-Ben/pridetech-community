import { SAMPLE_MEMBERS } from '../members/sampleMembers'
import type { Registrant } from './registrant'

/* Invented registrants, generated rather than written out, so the big lists
   are big enough to feel at a door. Nobody here is real and every address is
   @example.com. The inconsistencies are the point: the two earliest events
   have no email at all because their forms never asked, only some events
   captured company and job title, one keeps a waitlist, and two collect a
   plus-one who is a guest rather than a member.

   Delete this file, and sampleEvents, once the response sheets are read. */

const FIRST_NAMES = [
  'Avigail',
  'Barak',
  'Carmel',
  'Dror',
  'Elior',
  'Fanny',
  'Gilad',
  'Hadar',
  'Inbar',
  'Jonah',
  'Kinneret',
  'Lior',
  'Meirav',
  'Neta',
  'Omri',
  'Paz',
  'Quinn',
  'Ravit',
  'Shaked',
  'Tomer',
  'Uri',
  'Vered',
  'Yotam',
  'Zohar',
] as const

const SURNAMES = [
  'Ashkenazi',
  'Bar-Nir',
  'Cohensky',
  'Dagan',
  'Elmaliach',
  'Fridman',
  'Gavrieli',
  'Harpaz',
  'Ivgi',
  'Jarrah',
  'Kalisher',
  'Landsman',
  'Mazuz',
  'Nahmias',
  'Ohayon',
  'Peretz',
  'Rotblatt',
  'Segev',
  'Tannenbaum',
  'Urbach',
  'Vaknin',
  'Weisz',
  'Yarkoni',
  'Zilberman',
] as const

const COMPANIES = [
  'Halberd Analytics',
  'Quillon Cloud',
  'Fennimore Labs',
  'Tessellate Robotics',
  'Marrow and Vine',
  'Kiln Street Collective',
  'Pell and Quarry',
  'Ashgrove Biotech',
] as const

const JOB_TITLES = [
  'Frontend Developer',
  'Data Analyst',
  'Product Manager',
  'DevOps Engineer',
  'UX Designer',
  'Engineering Manager',
  'QA Engineer',
  'Security Analyst',
] as const

type SamplePerson = {
  name: string
  email: string | undefined
  company: string | undefined
  jobTitle: string | undefined
}

type SampleEventPlan = {
  eventId: string
  eventDate: string
  registeredCount: number
  waitlistCount: number
  guestCount: number
  memberCount: number
  personOffset: number
  arrivalPercentage: number
  hasEmailColumn: boolean
  hasCompanyColumn: boolean
}

const pickFrom = <Item>({ items, index }: { items: readonly Item[]; index: number }): Item => {
  const item = items[index % items.length]
  if (item === undefined) {
    throw new Error('Sample pool is empty')
  }
  return item
}

const inventPerson = ({
  personNumber,
  hasCompanyColumn,
}: {
  personNumber: number
  hasCompanyColumn: boolean
}): SamplePerson => {
  /* The stride keeps consecutive people from sharing a surname while still
     giving every person in a run of 576 a name of their own. */
  const firstName = pickFrom({ items: FIRST_NAMES, index: personNumber })
  const surname = pickFrom({
    items: SURNAMES,
    index: Math.floor(personNumber / FIRST_NAMES.length) + personNumber * 7,
  })

  return {
    name: `${firstName} ${surname}`,
    email: `${firstName}.${surname}@example.com`.toLowerCase(),
    company: hasCompanyColumn ? pickFrom({ items: COMPANIES, index: personNumber }) : undefined,
    jobTitle: hasCompanyColumn ? pickFrom({ items: JOB_TITLES, index: personNumber * 3 }) : undefined,
  }
}

const takeMember = ({
  index,
  hasCompanyColumn,
}: {
  index: number
  hasCompanyColumn: boolean
}): SamplePerson => {
  const member = pickFrom({ items: SAMPLE_MEMBERS, index })
  return {
    name: member.name,
    email: member.mail,
    company: hasCompanyColumn ? member.company : undefined,
    jobTitle: hasCompanyColumn ? member.title : undefined,
  }
}

/* Spread rather than sequential, so the people who did not turn up are not all
   the ones added last. */
const doesPersonArrive = ({
  index,
  arrivalPercentage,
}: {
  index: number
  arrivalPercentage: number
}): boolean => (index * 37) % 100 < arrivalPercentage

const toCheckInTime = ({ eventDate, index }: { eventDate: string; index: number }): string =>
  `${eventDate}T18:${String(index % 60).padStart(2, '0')}:00.000Z`

const buildEventRegistrants = (plan: SampleEventPlan): readonly Registrant[] => {
  const placeCount = plan.registeredCount + plan.waitlistCount

  const placeHolders = Array.from({ length: placeCount }, (_unused, index) => {
    const person =
      index < plan.memberCount
        ? takeMember({ index: index + plan.personOffset, hasCompanyColumn: plan.hasCompanyColumn })
        : inventPerson({
            personNumber: index + plan.personOffset,
            hasCompanyColumn: plan.hasCompanyColumn,
          })
    const isWaitlisted = index >= plan.registeredCount
    const doesArrive =
      !isWaitlisted && doesPersonArrive({ index, arrivalPercentage: plan.arrivalPercentage })

    return {
      id: `${plan.eventId}-r${index}`,
      eventId: plan.eventId,
      name: person.name,
      email: plan.hasEmailColumn ? person.email : undefined,
      company: person.company,
      jobTitle: person.jobTitle,
      registration: isWaitlisted ? ('waitlist' as const) : ('registered' as const),
      checkedInAt: doesArrive ? toCheckInTime({ eventDate: plan.eventDate, index }) : undefined,
      guestOfEmail: undefined,
      isWalkIn: false,
    }
  })

  const guests = Array.from({ length: plan.guestCount }, (_unused, guestIndex) => {
    const person = inventPerson({
      personNumber: guestIndex + plan.personOffset + 500,
      hasCompanyColumn: false,
    })
    const host = placeHolders[guestIndex]

    return {
      id: `${plan.eventId}-g${guestIndex}`,
      eventId: plan.eventId,
      name: person.name,
      email: person.email,
      company: undefined,
      jobTitle: undefined,
      registration: 'registered' as const,
      checkedInAt: doesPersonArrive({ index: guestIndex, arrivalPercentage: plan.arrivalPercentage })
        ? toCheckInTime({ eventDate: plan.eventDate, index: guestIndex })
        : undefined,
      guestOfEmail: host?.email,
      isWalkIn: false,
    }
  })

  return [...placeHolders, ...guests]
}

const SAMPLE_EVENT_PLANS: readonly SampleEventPlan[] = [
  {
    eventId: 'event-opening',
    eventDate: '2025-05-14',
    registeredCount: 28,
    waitlistCount: 0,
    guestCount: 0,
    memberCount: 11,
    personOffset: 0,
    arrivalPercentage: 75,
    hasEmailColumn: false,
    hasCompanyColumn: false,
  },
  {
    eventId: 'event-second',
    eventDate: '2025-07-09',
    registeredCount: 34,
    waitlistCount: 0,
    guestCount: 0,
    memberCount: 14,
    personOffset: 3,
    arrivalPercentage: 74,
    hasEmailColumn: false,
    hasCompanyColumn: false,
  },
  {
    eventId: 'event-rooftop',
    eventDate: '2025-09-03',
    registeredCount: 62,
    waitlistCount: 0,
    guestCount: 0,
    memberCount: 21,
    personOffset: 7,
    arrivalPercentage: 71,
    hasEmailColumn: true,
    hasCompanyColumn: true,
  },
  {
    eventId: 'event-winter',
    eventDate: '2025-12-10',
    registeredCount: 20,
    waitlistCount: 0,
    guestCount: 0,
    memberCount: 9,
    personOffset: 11,
    arrivalPercentage: 70,
    hasEmailColumn: true,
    hasCompanyColumn: true,
  },
  {
    eventId: 'event-singles',
    eventDate: '2026-02-11',
    registeredCount: 38,
    waitlistCount: 0,
    guestCount: 12,
    memberCount: 18,
    personOffset: 2,
    arrivalPercentage: 88,
    hasEmailColumn: true,
    hasCompanyColumn: false,
  },
  {
    eventId: 'event-panel',
    eventDate: '2026-06-24',
    registeredCount: 118,
    waitlistCount: 0,
    guestCount: 0,
    memberCount: 25,
    personOffset: 5,
    arrivalPercentage: 60,
    hasEmailColumn: true,
    hasCompanyColumn: true,
  },
  {
    eventId: 'event-hiring',
    eventDate: '2026-09-24',
    registeredCount: 196,
    waitlistCount: 24,
    guestCount: 0,
    memberCount: 25,
    personOffset: 13,
    arrivalPercentage: 0,
    hasEmailColumn: true,
    hasCompanyColumn: true,
  },
  {
    eventId: 'event-boardgames',
    eventDate: '2026-10-15',
    registeredCount: 26,
    waitlistCount: 0,
    guestCount: 9,
    memberCount: 16,
    personOffset: 19,
    arrivalPercentage: 0,
    hasEmailColumn: true,
    hasCompanyColumn: false,
  },
]

export const SAMPLE_EVENT_REGISTRANTS: readonly Registrant[] = SAMPLE_EVENT_PLANS.flatMap(
  buildEventRegistrants,
)
