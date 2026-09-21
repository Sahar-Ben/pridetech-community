import type { Lead } from './lead'

export type Gender = 'unknown' | 'F' | 'M'

export type ApprovalDecision = {
  lead: Lead
  gender: Gender
}

export type DeclineDecision = {
  lead: Lead
}

/* The same shape as a decline and deliberately not the same type: they are
   different acts on the sheet, and a call site that can be handed either one by
   mistake is how an application gets turned away instead of kept. */
export type MaybeDecision = {
  lead: Lead
}

export type DecisionKind = 'approve' | 'decline' | 'maybe'
