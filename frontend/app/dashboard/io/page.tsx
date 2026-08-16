"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowUpRight,
  Activity,
  RefreshCw,
  Clock,
  Shield,
  FileText,
  Search,
  ChevronRight,
} from "lucide-react";

import {
  getMyCases,
  ApiError,
  type CaseListItem,
} from "@/lib/caseSummaryApi";

type DashboardCase = CaseListItem & {
  created_at?: string | null;
  updated_at?: string | null;
};

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isClosedCase(c: DashboardCase) {
  const status = normalize(c.status);

  return [
    "closed",
    "resolved",
    "completed",
    "case closed",
  ].some((value) => status.includes(value));
}

function isHighPriority(c: DashboardCase) {
  const priority = normalize(c.priority);

  return ["high", "critical", "urgent"].some((value) =>
    priority.includes(value)
  );
}

function isActiveCase(c: DashboardCase) {
  return !isClosedCase(c);
}

function needsAttention(c: DashboardCase) {
  const status = normalize(c.status);
  const stage = normalize(c.current_stage);

  const attentionWords = [
    "pending",
    "awaiting",
    "approval",
    "review",
    "response",
    "action required",
    "follow up",
    "follow-up",
    "document required",
  ];

  return attentionWords.some(
    (word) => status.includes(word) || stage.includes(word)
  );
}

function getCaseStatusClasses(status?: string | null) {
  const value = normalize(status);

  if (
    value.includes("closed") ||
    value.includes("resolved") ||
    value.includes("completed")
  ) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }

  if (
    value.includes("pending") ||
    value.includes("awaiting") ||
    value.includes("review")
  ) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (
    value.includes("investigation") ||
    value.includes("active")
  ) {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }

  return "bg-gray-50 text-gray-700 border-gray-200";
}

function getPriorityClasses(priority?: string | null) {
  const value = normalize(priority);

  if (value.includes("high") || value.includes("critical")) {
    return "bg-red-50 text-red-800 border-red-200";
  }

  if (value.includes("medium")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  return "bg-emerald-50 text-emerald-800 border-emerald-200";
}

export default function IODashboard() {
  const [cases, setCases] = useState<DashboardCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await getMyCases();

      setCases(data as DashboardCase[]);
    } catch (err) {
      console.error("Failed to load IO dashboard:", err);

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load your cases."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Refresh dashboard every 30 seconds.
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ------------------------------------------------------------
  // Derived dashboard statistics
  // ------------------------------------------------------------

  const stats = useMemo(() => {
    const total = cases.length;

    const active = cases.filter(isActiveCase).length;

    const closed = cases.filter(isClosedCase).length;

    const highPriority = cases.filter(isHighPriority).length;

    const attention = cases.filter(needsAttention).length;

    return {
      total,
      active,
      closed,
      highPriority,
      attention,
    };
  }, [cases]);

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return cases;
    }

    return cases.filter((c) =>
      [
        c.case_number,
        c.title,
        c.status,
        c.priority,
        c.current_stage,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [cases, search]);

  // ------------------------------------------------------------
  // Recent cases
  // ------------------------------------------------------------

  const recentCases = useMemo(() => {
    return [...filteredCases]
      .sort((a, b) => {
        const aDate = a.updated_at
          ? new Date(a.updated_at).getTime()
          : 0;

        const bDate = b.updated_at
          ? new Date(b.updated_at).getTime()
          : 0;

        return bDate - aDate;
      })
      .slice(0, 6);
  }, [filteredCases]);

  // ------------------------------------------------------------
  // Cases requiring attention
  // ------------------------------------------------------------

  const attentionCases = useMemo(() => {
    return cases
      .filter(needsAttention)
      .sort((a, b) => {
        const aDate = a.updated_at
          ? new Date(a.updated_at).getTime()
          : 0;

        const bDate = b.updated_at
          ? new Date(b.updated_at).getTime()
          : 0;

        return bDate - aDate;
      })
      .slice(0, 5);
  }, [cases]);

  // ------------------------------------------------------------
  // Recent activity derived from actual case timestamps
  // ------------------------------------------------------------

  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      caseId: string;
      type: "created" | "updated";
    }> = [];

    cases.forEach((c) => {
      if (c.updated_at) {
        activities.push({
          id: `${c.case_id}-updated`,
          title: "Case updated",
          description:
            c.current_stage ||
            c.status ||
            "Case information was updated.",
          date: c.updated_at,
          caseId: c.case_number || c.case_id,
          type: "updated",
        });
      }

      if (c.created_at) {
        activities.push({
          id: `${c.case_id}-created`,
          title: "Case assigned",
          description:
            c.title || "A new case was assigned to you.",
          date: c.created_at,
          caseId: c.case_number || c.case_id,
          type: "created",
        });
      }
    });

    return activities
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 6);
  }, [cases]);

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-gold-200 bg-white p-12 text-center">
            <Activity className="mx-auto h-7 w-7 animate-spin text-maroon-700" />

            <p className="mt-3 text-sm text-ink-600">
              Loading your investigation dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-ivory p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load dashboard
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

                <button
                  onClick={() => loadDashboard(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-maroon-800 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
              Investigation Officer
            </p>

            <h1 className="mt-1 font-display text-3xl font-bold text-maroon-900">
              Investigation Dashboard
            </h1>

            <p className="mt-1 text-sm text-ink-600">
              Monitor assigned cases, investigation progress and
              actions requiring your attention.
            </p>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-300 bg-white px-4 py-2.5 text-sm font-medium text-maroon-800 shadow-sm hover:bg-gold-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =====================================================
            SEARCH
        ====================================================== */}

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your cases..."
            className="w-full rounded-lg border border-gold-300 bg-white py-3 pl-10 pr-4 text-sm text-ink-900 outline-none focus:border-maroon-600"
          />
        </div>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">

          <KpiCard
            label="Total Cases"
            value={stats.total}
            icon={<FolderKanban className="h-5 w-5" />}
          />

          <KpiCard
            label="Active Cases"
            value={stats.active}
            icon={<Activity className="h-5 w-5" />}
          />

          <KpiCard
            label="Needs Attention"
            value={stats.attention}
            icon={<Clock className="h-5 w-5" />}
            danger={stats.attention > 0}
          />

          <KpiCard
            label="High Priority"
            value={stats.highPriority}
            icon={<AlertTriangle className="h-5 w-5" />}
            danger={stats.highPriority > 0}
          />

          <KpiCard
            label="Closed Cases"
            value={stats.closed}
            icon={<Archive className="h-5 w-5" />}
          />

        </section>

        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ===================================================
              ATTENTION
          ==================================================== */}

          <section className="rounded-xl border border-gold-200 bg-white p-5 lg:col-span-1">

            <div className="flex items-center justify-between border-b border-gold-100 pb-4">

              <div>
                <h2 className="font-display text-lg font-bold text-maroon-900">
                  Needs Attention
                </h2>

                <p className="mt-1 text-xs text-ink-600">
                  Cases that may require your next action
                </p>
              </div>

              <AlertTriangle className="h-5 w-5 text-gold-600" />

            </div>

            <div className="mt-4 space-y-3">

              {attentionCases.length === 0 ? (
                <EmptyState
                  icon={<Shield className="h-5 w-5" />}
                  text="No cases currently require attention."
                />
              ) : (
                attentionCases.map((c) => (
                  <Link
                    key={c.case_id}
                    href={`/cases/${c.case_id}`}
                    className="block rounded-lg border border-gold-100 bg-ivory/30 p-3 transition hover:border-gold-300 hover:bg-gold-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-xs font-mono font-bold text-maroon-800">
                          {c.case_number || c.case_id}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-ink-900">
                          {c.title || "Untitled case"}
                        </p>

                        <p className="mt-1 text-xs text-ink-600">
                          {c.current_stage ||
                            c.status ||
                            "Action required"}
                        </p>

                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-500" />

                    </div>
                  </Link>
                ))
              )}

            </div>

          </section>

          {/* ===================================================
              RECENT CASES
          ==================================================== */}

          <section className="rounded-xl border border-gold-200 bg-white p-5 lg:col-span-2">

            <div className="flex items-center justify-between border-b border-gold-100 pb-4">

              <div>
                <h2 className="font-display text-lg font-bold text-maroon-900">
                  Recent Cases
                </h2>

                <p className="mt-1 text-xs text-ink-600">
                  Your most recently updated investigations
                </p>
              </div>

              <Link
                href="/cases"
                className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-700 hover:text-maroon-900 hover:underline"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>

            </div>

            <div className="mt-4 overflow-x-auto">

              {recentCases.length === 0 ? (
                <EmptyState
                  icon={<FolderKanban className="h-5 w-5" />}
                  text="No cases found."
                />
              ) : (
                <table className="w-full min-w-[650px] text-left">

                  <thead>
                    <tr className="border-b border-gold-100 text-[10px] uppercase tracking-wider text-ink-600">
                      <th className="px-2 py-3">
                        Case
                      </th>

                      <th className="px-2 py-3">
                        Title
                      </th>

                      <th className="px-2 py-3">
                        Status
                      </th>

                      <th className="px-2 py-3">
                        Priority
                      </th>

                      <th className="px-2 py-3 text-right">
                        Updated
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gold-100">

                    {recentCases.map((c) => (
                      <tr
                        key={c.case_id}
                        className="hover:bg-gold-50/20"
                      >

                        <td className="px-2 py-3">

                          <Link
                            href={`/cases/${c.case_id}`}
                            className="font-mono text-xs font-bold text-maroon-700 hover:underline"
                          >
                            {c.case_number || c.case_id}
                          </Link>

                        </td>

                        <td className="max-w-[220px] px-2 py-3">

                          <p className="truncate text-xs font-medium text-ink-900">
                            {c.title || "Untitled case"}
                          </p>

                        </td>

                        <td className="px-2 py-3">

                          <span
                            className={`inline-flex rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${getCaseStatusClasses(
                              c.status
                            )}`}
                          >
                            {c.status || "Unknown"}
                          </span>

                        </td>

                        <td className="px-2 py-3">

                          <span
                            className={`inline-flex rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${getPriorityClasses(
                              c.priority
                            )}`}
                          >
                            {c.priority || "—"}
                          </span>

                        </td>

                        <td className="px-2 py-3 text-right">

                          <span className="text-[10px] font-mono text-ink-600">
                            {formatDate(c.updated_at)}
                          </span>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              )}

            </div>

          </section>

        </div>

        {/* =====================================================
            ACTIVITY
        ====================================================== */}

        <section className="rounded-xl border border-gold-200 bg-white p-5">

          <div className="border-b border-gold-100 pb-4">

            <h2 className="font-display text-lg font-bold text-maroon-900">
              Recent Activity
            </h2>

            <p className="mt-1 text-xs text-ink-600">
              Recent changes to your assigned cases
            </p>

          </div>

          <div className="mt-5">

            {recentActivity.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                text="No recent activity available."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">

                {recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/cases/${cases.find(
                      (c) =>
                        (c.case_number || c.case_id) ===
                        activity.caseId
                    )?.case_id || ""}`}
                    className="rounded-lg border border-gold-100 bg-ivory/20 p-4 transition hover:border-gold-300 hover:bg-gold-50/20"
                  >

                    <div className="flex items-start gap-3">

                      <div className="mt-0.5 rounded-full bg-gold-50 p-2 text-maroon-700">
                        {activity.type === "created" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <p className="text-xs font-bold text-ink-900">
                            {activity.title}
                          </p>

                          <span className="shrink-0 text-[9px] font-mono text-ink-500">
                            {formatDate(activity.date)}
                          </span>

                        </div>

                        <p className="mt-1 font-mono text-[10px] font-semibold text-maroon-700">
                          {activity.caseId}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs text-ink-600">
                          {activity.description}
                        </p>

                        <p className="mt-2 text-[9px] text-ink-500">
                          {formatDateTime(activity.date)}
                        </p>

                      </div>

                    </div>

                  </Link>
                ))}

              </div>
            )}

          </div>

        </section>

        {/* =====================================================
            QUICK OPERATIONS
        ====================================================== */}

        <section>

          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-maroon-900">
              Quick Operations
            </h2>

            <p className="mt-1 text-xs text-ink-600">
              Access the investigation tools directly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <QuickOperation
              title="My Cases"
              description="View and manage cases assigned to you."
              href="/cases"
              icon={<FolderKanban className="h-5 w-5" />}
            />

            <QuickOperation
              title="AI Assistant"
              description="Analyze evidence, statements and investigation information."
              href="/ai-assistant"
              icon={<Activity className="h-5 w-5" />}
            />

            <QuickOperation
              title="Case Summary"
              description="Review the consolidated investigation summary."
              href="/case-summary"
              icon={<FileText className="h-5 w-5" />}
            />

            

          </div>

        </section>

      </div>
    </div>
  );
}

/* =============================================================
   KPI CARD
============================================================= */

function KpiCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        danger
          ? "border-red-200"
          : "border-gold-200"
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">
          {label}
        </span>

        <span
          className={
            danger
              ? "text-red-600"
              : "text-maroon-700"
          }
        >
          {icon}
        </span>

      </div>

      <p
        className={`mt-3 font-display text-3xl font-bold ${
          danger
            ? "text-red-700"
            : "text-ink-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

/* =============================================================
   EMPTY STATE
============================================================= */

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gold-200 bg-ivory/20 px-6 py-10 text-center">

      <div className="rounded-full bg-gold-50 p-3 text-maroon-700">
        {icon}
      </div>

      <p className="mt-3 text-xs text-ink-600">
        {text}
      </p>

    </div>
  );
}

/* =============================================================
   QUICK OPERATION
============================================================= */

function QuickOperation({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gold-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-300 hover:shadow-md"
    >

      <div className="flex items-center justify-between">

        <div className="rounded-lg bg-gold-50 p-2.5 text-maroon-700">
          {icon}
        </div>

        <ArrowUpRight className="h-4 w-4 text-ink-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-maroon-700" />

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