"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  CalendarDays,
  CalendarRange,
  UserCheck,
} from "lucide-react";

interface Complaint {
  complaint_id: string;
  status?: string;
  created_at?: string;
}

export default function ComplaintStats() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:8000";

        const response = await axios.get(
          `${API_BASE}/api/complaints`
        );

        setComplaints(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load complaint statistics:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonth = complaints.filter((complaint) => {
    if (!complaint.created_at) return false;

    const date = new Date(complaint.created_at);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  }).length;

  const thisYear = complaints.filter((complaint) => {
    if (!complaint.created_at) return false;

    const date = new Date(complaint.created_at);

    return date.getFullYear() === currentYear;
  }).length;

  const assigned = complaints.filter(
    (complaint) =>
      complaint.status?.toLowerCase() === "assigned"
  ).length;

  const unassigned = complaints.length - assigned;

  const stats = [
    {
      title: "Total Complaints",
      value: complaints.length,
      description: "Registered at station",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "This Month",
      value: thisMonth,
      description: "Complaints registered",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      title: "This Year",
      value: thisYear,
      description: "Complaints registered",
      icon: <CalendarRange className="h-5 w-5" />,
    },
    {
      title: "Assigned to IO",
      value: assigned,
      description: `${unassigned} awaiting assignment`,
      icon: <UserCheck className="h-5 w-5" />,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-xl border border-gold-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                {stat.title}
              </p>

              <p className="mt-2 font-display text-3xl font-bold text-maroon-900">
                {loading ? "—" : stat.value}
              </p>

              <p className="mt-1 text-xs text-ink-500">
                {stat.description}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-maroon-50 text-maroon-700">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}