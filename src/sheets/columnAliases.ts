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
  status: ['status'],
  // "Arrived to the bus" (Playtika) records shuttle passengers, not attendance — matching is exact, never substring.
  arrived: ['arrived'],
} as const satisfies Record<string, readonly string[]>
