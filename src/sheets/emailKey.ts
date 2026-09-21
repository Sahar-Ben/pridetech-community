/* Both sides of a lead-to-member match must reduce an address the same way, or
   someone who is already a member stays in the review queue. `readCell` already
   trims what it reads; the trim is repeated here so the one normalisation is
   whole on its own and a hand-built address cannot slip past it. */
export const toEmailKey = (email: string): string => email.trim().toLowerCase()
