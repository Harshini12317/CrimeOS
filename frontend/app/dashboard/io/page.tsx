

export default function IODashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl text-ink-900">Investigating Officer</h1>
      <p className="mt-1 text-ink-600">Complaint ingestion, AI-suggested investigation paths.</p>

<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
      <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Get Legal Suggestions</h2>
          <p className="mt-1 text-sm text-ink-600">
            AI-suggested investigation paths grounded in SOPs, with relevant BNS/BNSS/BSA sections and case law.
          </p>
          {/* TODO: */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Register Complaints</h2>
          <p className="mt-1 text-sm text-ink-600">Register new complaints easily</p>
          {/* TODO: list from your investigation/case endpoints */}
        </section>
        </div>
      
<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">New Complaints</h2>
          <p className="mt-1 text-sm text-ink-600">
            Ingest complaints from PDFs, audio, or images. Multilingual (Gujarati/Hindi/English).
          </p>
          {/* TODO: complaint ingestion form / list */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">My Open Cases</h2>
          <p className="mt-1 text-sm text-ink-600">Cases currently assigned to you.</p>
          {/* TODO: list from your investigation/case endpoints */}
        </section>
      </div>
      </div>
    
  );
}