import { listMemberEmails, type Member } from '../members/member'

const normaliseEmail = (email: string): string => email.trim().toLowerCase()

/* Response sheets are typed by hand: the same person is `Dana.Sorkin@Example.com`
   on one form and ` dana.sorkin@example.com ` on the next. */
export const doesEmailMatch = ({ left, right }: { left: string; right: string }): boolean =>
  normaliseEmail(left) === normaliseEmail(right)

/* A member answers to their main address and to every other one recorded for
   them. */
export const doesMemberHaveEmail = ({ member, email }: { member: Member; email: string }): boolean =>
  listMemberEmails(member).some((memberEmail) => doesEmailMatch({ left: memberEmail, right: email }))
