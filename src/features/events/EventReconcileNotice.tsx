/* Matching is by email only, and exact once case and spaces are set aside. The
   flow that links the rest by hand waits on seeing how badly the real response
   sheets disagree; saying so beats shipping a matcher that quietly links the
   wrong people. */
export const EventReconcileNotice = () => (
  <section className="rounded-xl border border-dashed border-edge px-4 py-3">
    <h4 className="text-sm font-bold text-ink">
      Linking registrants to members
    </h4>
    <p className="mt-1 text-sm text-ink-muted">
      Registrants are matched to members by email. Linking the ones that did not match, or
      adding them as members, is not built yet: somebody marked as not matched may be a member
      who registered with a different address.
    </p>
  </section>
)
