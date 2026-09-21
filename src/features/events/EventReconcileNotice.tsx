/* The reconcile flow is the one piece that cannot be designed against invented
   data: it depends on how badly the 22 real response sheets disagree. Saying
   so beats shipping a matcher that quietly links the wrong people. */
export const EventReconcileNotice = () => (
  <section className="rounded-xl border border-dashed border-edge px-4 py-3">
    <h4 className="text-sm font-bold text-ink">
      Linking registrants to members
    </h4>
    <p className="mt-1 text-sm text-ink-muted">
      Not built yet. Rows marked as not matched stay that way: linking them to a member, or adding
      them as one, needs the real response sheets rather than this sample data.
    </p>
  </section>
)
