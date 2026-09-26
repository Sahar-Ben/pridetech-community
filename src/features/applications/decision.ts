import type { Lead } from './lead'

export type Gender = 'unknown' | 'F' | 'M'

export type ApprovalDecision = {
  lead: Lead
  gender: Gender
}

/* `reason` is stated rather than optional, so a call site that has not thought
   about the reason cannot compile: a decision quietly carrying no reason is a
   reviewer's sentence dropped on the floor. Skipping it is a choice the reviewer
   makes, and `undefined` is how they make it. */
export type DeclineDecision = {
  lead: Lead
  reason: string | undefined
}

/* The same shape as a decline and deliberately not the same type: they are
   different acts on the sheet, and a call site that can be handed either one by
   mistake is how an application gets turned away instead of kept. */
export type MaybeDecision = {
  lead: Lead
  reason: string | undefined
}

export type DecisionKind = 'approve' | 'decline' | 'maybe'
