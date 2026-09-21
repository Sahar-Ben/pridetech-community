const normaliseEmail = (email: string): string => email.trim().toLowerCase()

/* Response sheets are typed by hand: the same person is `Dana.Sorkin@Example.com`
   on one form and ` dana.sorkin@example.com ` on the next. */
export const doesEmailMatch = ({ left, right }: { left: string; right: string }): boolean =>
  normaliseEmail(left) === normaliseEmail(right)
