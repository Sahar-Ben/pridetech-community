export type LeadStatus = 'pending' | 'approved' | 'declined'

export type Lead = {
  rowNumber: number
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
