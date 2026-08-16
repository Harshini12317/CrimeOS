"use client";

import Link from "next/link";
import {
  FileText,
  Plus,
  ClipboardList,
  BookOpen,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import ComplaintList from "@/components/complaint/ComplaintList";

export default function SHODashboard() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-ivory">
      <div className="mx-auto w-full max-w-7xl space-y-7 p-6 md:p-8">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <section className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-maroon-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-maroon-800">
                  Station Officer
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold text-maroon-900 md:text-3xl">
                Station House Officer
              </h1>

              <p className="mt-1 text-sm text-ink-600">
                Register complaints and review station complaints and case
                summaries.
              </p>
            </div>

            <Link
              href="/complaints/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-ivory shadow-sm transition hover:bg-maroon-700"
            >
              <Plus className="h-4 w-4" />
              Register Complaint
            </Link>

          </div>
        </section>


        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <QuickAction
            href="/complaints/register"
            icon={<Plus className="h-5 w-5" />}
            title="Register Complaint"
            description="Register a new complaint at the station."
          />

          <QuickAction
            href="/complaints"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Complaint List"
            description="View complaints registered at the station."
          />

          <QuickAction
            href="/case-summary"
            icon={<BookOpen className="h-5 w-5" />}
            title="Case Summaries"
            description="Review generated summaries for station cases."
          />

        </section>


        {/* =====================================================
            RECENT COMPLAINTS
        ===================================================== */}
        <section className="rounded-xl border border-gold-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-gold-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-maroon-700" />

                <h2 className="font-display text-lg font-bold text-maroon-900">
                  Recently Registered Complaints
                </h2>
              </div>

              <p className="mt-1 text-xs text-ink-600">
                Complaints registered at this station.
              </p>
            </div>

            <Link
              href="/complaints"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon-700 hover:text-maroon-900 hover:underline"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

          </div>

          <div className="p-4 md:p-5">
            <ComplaintList limit={5}/>
          </div>

        </section>


        {/* =====================================================
            CASE SUMMARIES
        ===================================================== */}
        <section className="rounded-xl border border-gold-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-gold-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-maroon-700" />

                <h2 className="font-display text-lg font-bold text-maroon-900">
                  Case Summaries
                </h2>
              </div>

              <p className="mt-1 text-xs text-ink-600">
                Review generated case summaries and investigation information.
              </p>
            </div>

            <Link
              href="/case-summary"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon-700 hover:text-maroon-900 hover:underline"
            >
              View Summaries
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

          </div>

          <div className="p-6">

            <Link
              href="/case-summary"
              className="group flex items-center justify-between rounded-lg border border-gold-100 bg-ivory/30 p-4 transition hover:border-gold-300 hover:bg-gold-50/30"
            >
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-maroon-700">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-ink-900 group-hover:text-maroon-800">
                    Open Case Summaries
                  </h3>

                  <p className="mt-1 text-xs text-ink-600">
                    View AI-generated summaries and investigation details for
                    available cases.
                  </p>
                </div>

              </div>

              <ChevronRight className="h-5 w-5 text-ink-400 group-hover:text-maroon-700" />
            </Link>

          </div>

        </section>


        {/* =====================================================
            FOOTER
        ===================================================== */}
        <div className="border-t border-gold-200 pt-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-ink-500">
            Confidential Police Investigation System
          </p>
        </div>

      </div>
    </main>
  );
}


/* ================================================================
   QUICK ACTION
================================================================ */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gold-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-700">
          {icon}
        </div>

        <ChevronRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-maroon-700" />

      </div>

      <h3 className="mt-4 text-sm font-bold text-ink-900 group-hover:text-maroon-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-relaxed text-ink-600">
        {description}
      </p>
    </Link>
  );
}