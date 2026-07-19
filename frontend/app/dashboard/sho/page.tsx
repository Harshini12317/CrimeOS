// Complaint registration and case management dashboard for Station House Officers (SHOs).

import Link from "next/link";
import ComplaintList from "@/components/complaint/ComplaintList";

export default function SHODashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Station House Officer</h1>
          <p className="mt-1 text-ink-600">Station-wide case oversight and approvals.</p>
        </div>

      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-gold-200 bg-white p-5 sm:col-span-2">
          <h2 className="font-medium text-ink-900">Recently Registered Complaints</h2>
          <p className="mt-1 text-sm text-ink-600">Complaints filed at this station.</p>
          <div className="mt-4">
            <ComplaintList />
          </div>
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Station Case Overview</h2>
          <p className="mt-1 text-sm text-ink-600">All cases across IOs at this station, by status.</p>
          {/* TODO: aggregate view across IOs */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Pending Approvals</h2>
          <p className="mt-1 text-sm text-ink-600">Legal requests or investigation paths awaiting sign-off.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Case Summaries</h2>
          <p className="mt-1 text-sm text-ink-600">Auto-generated case logs and summaries.</p>
          {/* TODO */}
        </section>

        <section className="rounded-lg border border-gold-200 bg-white p-5">
          <h2 className="font-medium text-ink-900">Audit Trail</h2>
          <p className="mt-1 text-sm text-ink-600">Search and version history across the station.</p>
          {/* TODO */}
        </section>
      </div>
    </div>
  );
}