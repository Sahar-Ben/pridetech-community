export type LeadStatus = 'pending' | 'approved' | 'declined'

/* `timestamp` is the Google Form's own submission stamp, written once when the
   response arrived and never touched afterwards. It is carried because a row
   number goes stale and an address does not identify a row: 69 addresses on this
   tab are on more than one application, so the stamp is what tells one of a
   person's applications from another at the moment of the write. */
export type Lead = {
  rowNumber: number
  timestamp: string | undefined
  name: string | undefined
  jobTitle: string | undefined
  company: string | undefined
  linkedIn: string | undefined
  email: string
  phone: string | undefined
  city: string | undefined
  interests: string | undefined
  status: LeadStatus
}
