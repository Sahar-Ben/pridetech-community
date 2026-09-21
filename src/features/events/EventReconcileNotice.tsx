/* The reconcile flow is the one piece that cannot be designed against invented
   data: it depends on how badly the 22 real response sheets disagree. Saying
   so beats shipping a matcher that quietly links the wrong people. */
export const EventReconcileNotice = () => (
  <section className="rounded-md border border-dashed border-slate-300 px-4 py-3 dark:border-slate-700">
    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
      Linking registrants to members
    </h4>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Not built yet. Rows marked as not matched stay that way: linking them to a member, or adding
      them as one, needs the real response sheets rather than this sample data.
    </p>
  </section>
)
