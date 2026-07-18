export default function IODashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-ink-900">Investigating Officer</h1>
      <p className="mt-1 text-ink-600">Complaint ingestion, AI-suggested investigation paths.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">New Complaints</h2>
          <p className="mt-1 text-sm text-ink-600">
            Ingest complaints from PDFs, audio, or images. Multilingual (Gujarati/Hindi/English).
          </p>
          {/* TODO: complaint ingestion form / list, wired to your investigation router */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Suggested Investigation Paths</h2>
          <p className="mt-1 text-sm text-ink-600">
            AI-suggested paths grounded in SOPs, with relevant BNS/BNSS/BSA sections.
          </p>
          {/* TODO: render suggestions per open case */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">My Open Cases</h2>
          <p className="mt-1 text-sm text-ink-600">Cases currently assigned to you.</p>
          {/* TODO: list from your existing investigation endpoints */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Legal Request Status</h2>
          <p className="mt-1 text-sm text-ink-600">Track requests you've generated and their responses.</p>
          {/* TODO */}
        </section>
      </div>
    </div>
  );
}