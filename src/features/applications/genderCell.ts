import type { Gender } from './decision'

/* `unknown` is written as an empty cell rather than the word: the Members tab's
   Gender column feeds the gender split, and a literal "unknown" would become a
   third gender in every chart drawn from it. */
export const toGenderCell = (gender: Gender): string => (gender === 'unknown' ? '' : gender)
