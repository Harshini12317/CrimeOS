export default function LegalAdvisorDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-ink-900">Legal Advisor</h1>
      <p className="mt-1 text-ink-600">Legal request review, relevant sections and case law.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Requests Awaiting Review</h2>
          <p className="mt-1 text-sm text-ink-600">
            Review cases, complaints, and legal requests awaiting your attention.
          </p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Case Review</h2>
          <p className="mt-1 text-sm text-ink-600">View complaint details, investigation notes, evidence and timeline.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Legal Review</h2>
          <p className="mt-1 text-sm text-ink-600">Verify AI suggested sections, review legal requests, add legal opinion.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Legal Library</h2>
          <p className="mt-1 text-sm text-ink-600">Search BNS/BNSS/BSA sections and case laws.</p>
          {/* TODO */}
        </section>
      </div>
    </div>
  );
}