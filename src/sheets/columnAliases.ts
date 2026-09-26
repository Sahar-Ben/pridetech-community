export const COLUMN_ALIASES = {
  timestamp: ['timestamp'],
  name: ['name', 'full name'],
  jobTitle: ['job title', 'your job title', 'current job title', 'title'],
  company: [
    'company',
    'your company',
    'current employer / organization / company',
    'current employer / organization',
  ],
  email: ['email', 'your email', 'e-mail', 'mail'],
  phone: ['phone', 'phone number'],
  linkedIn: ['linkedin', 'linkedin profile (link)'],
  city: ['city', 'which city do you currently live in?'],
  interests: ['interests', 'please select your areas of interest (you can choose multiple)'],
  shirtSize: ['shirt size', 'please provide your shirt size (for potential swag)'],
  notes: ['notes'],
  informedForMembership: ['informed for membership'],
  status: ['status'],
  /* One column holds the reason a reviewer declined somebody and the reason they
     kept somebody for later, and the Status cell beside it is what says which of
     the two happened. It was headed "Declined reason" first, which read as a lie
     on every Maybe row; the older wordings stay here because a copy of the sheet
     may still carry one. */
  decisionReason: ['reason', 'declined reason', 'decline reason', 'decision reason'],
  gender: ['gender'],
  removalReason: ['removal reason'],
  approvedAt: ['approved at'],
  previousRemovalReason: ['previous removal reason'],
  rejoinedAt: ['rejoined at'],
  // "Arrived to the bus" (Playtika) records shuttle passengers, not attendance — matching is exact, never substring.
  arrived: ['arrived'],
} as const satisfies Record<string, readonly string[]>
