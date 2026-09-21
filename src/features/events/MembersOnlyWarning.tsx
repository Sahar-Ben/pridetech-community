import { NoticeBanner } from '../../app/NoticeBanner'

/* Stated, never enforced. The organiser is standing in front of the person,
   knows things this app does not, and an app that refuses them a decision at
   19:30 is worse than one that tells them the policy and gets out of the way. */
export const MembersOnlyWarning = () => (
  <NoticeBanner
    detail="You can still add them. The decision at the door is yours, and the event will show that they are not in the member list."
    title="This event is members only."
    tone="warning"
  />
)
