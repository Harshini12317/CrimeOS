// shared header (name, role, logout) for all three
"use client";

import { useAuth } from "../providers/AuthProvider";

const ROLE_LABELS: Record<string, string> = {
  IO: "Investigating Officer",
  SHO: "Station House Officer",
  LEGAL_ADVISOR: "Legal Advisor",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-ivory">
      <header className="flex items-center justify-between border-b border-gold-200 bg-white px-6 py-4">
        <span className="font-display text-lg text-maroon-600">CRIME OS</span>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-ink-600">
              <span className="font-medium text-ink-900">{user.name}</span>
              {" · "}
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          )}
          <button
            onClick={logout}
            className="rounded-md border border-gold-300 px-3 py-1.5 text-sm text-ink-900 hover:bg-gold-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}