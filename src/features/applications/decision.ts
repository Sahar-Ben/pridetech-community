import type { Lead } from './lead'

export type Gender = 'unknown' | 'F' | 'M'

export type ApprovalDecision = {
  lead: Lead
  gender: Gender
}

export type DeclineDecision = {
  lead: Lead
}

export type DecisionKind = 'approve' | 'decline'
