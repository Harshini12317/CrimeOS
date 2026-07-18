export default function LegalAdvisorDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-ink-900">Legal Advisor</h1>
      <p className="mt-1 text-ink-600">Legal request review, relevant sections and case law.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Requests Awaiting Review</h2>
          <p className="mt-1 text-sm text-ink-600">
            Auto-generated legal requests to telecom operators, banks, and platforms.
          </p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Suggested Legal Sections</h2>
          <p className="mt-1 text-sm text-ink-600">Relevant BNS/BNSS/BSA sections and case law, per case.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Dispatched Requests</h2>
          <p className="mt-1 text-sm text-ink-600">Track status and provider responses.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Response Analytics</h2>
          <p className="mt-1 text-sm text-ink-600">Analysis over data returned by service providers.</p>
          {/* TODO */}
        </section>
      </div>
    </div>
  );
}