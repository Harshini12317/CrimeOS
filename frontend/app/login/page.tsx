"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-ivory">
      {/* Identity panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-maroon-600 text-white px-16 py-14">
        <div>
          <span className="text-sm tracking-[0.2em] text-gold-300 font-semibold">CRIME OS</span>
          <h1 className="mt-6 font-display text-4xl leading-tight">
            Intelligence-led
            <br />
            investigations,
            <br />
            in one place.
          </h1>
          <p className="mt-6 text-maroon-100/80 max-w-sm text-sm leading-relaxed">
            Case ingestion, AI-suggested investigation paths, automated legal
            requests, and response analytics — accessible by role.
          </p>
        </div>
        <div className="text-xs text-maroon-100/60">
          Access is provisioned by your station administrator.
          <br />
          There is no self-registration on this system.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-sm tracking-[0.2em] text-maroon-600 font-semibold">CRIME OS</span>
          </div>

          <h2 className="font-display text-2xl text-ink-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-600">
            Use the credentials issued to your IO, SHO, or Legal Advisor account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-900">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-gold-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                placeholder="you@station.gov.in"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-900">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gold-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {formError && (
              <p
                role="alert"
                className="text-sm text-risk bg-maroon-50 border border-maroon-200 rounded-md px-3 py-2"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-maroon-600 py-2.5 text-sm font-medium text-white
                         hover:bg-maroon-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}