/* Matching is by email only, exact once case and spaces are set aside, across
   a member's main address and their other ones. Linking by hand is how the
   rest are matched: it records the address against the member, so the same
   person is matched on every later event without being linked again. */
export const EventReconcileNotice = () => (
  <section className="rounded-xl border border-dashed border-edge px-4 py-3">
    <h4 className="text-sm font-bold text-ink">
      Linking registrants to members
    </h4>
    <p className="mt-1 text-sm text-ink-muted">
      Registrants are matched to members by email, including any other emails recorded for
      them. Somebody marked as not matched may be a member who registered with a different
      address: use Link to member on their row to record it. Adding somebody as a new member
      from here is not built yet.
    </p>
  </section>
)
