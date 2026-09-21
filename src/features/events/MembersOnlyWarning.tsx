const WARNING_CLASSES =
  'rounded-md border-2 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950'

/* Stated, never enforced. The organiser is standing in front of the person,
   knows things this app does not, and an app that refuses them a decision at
   19:30 is worse than one that tells them the policy and gets out of the way. */
export const MembersOnlyWarning = () => (
  <div className={WARNING_CLASSES}>
    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
      This event is members only.
    </p>
    <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
      You can still add them. The decision at the door is yours, and the event will show that they
      are not in the member list.
    </p>
  </div>
)
