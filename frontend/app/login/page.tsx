"use client";

import {
  Suspense,
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useAuth } from "../providers/AuthProvider";


// ============================================================
// LOGIN FORM
// ============================================================

function LoginForm() {
  const { login } = useAuth();

  const router = useRouter();

  const searchParams =
    useSearchParams();

  // ============================================================
  // REDIRECT URL
  // ============================================================

  const from =
    searchParams.get("from");

  /*
   * Only allow internal routes.
   *
   * Prevents:
   *
   * /login?from=https://example.com
   */

  const redirectTo =
    from &&
    from.startsWith("/") &&
    !from.startsWith("//")
      ? from
      : null;

  // ============================================================
  // FORM STATE
  // ============================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError(null);

    setSubmitting(true);

    try {
      // --------------------------------------------------------
      // LOGIN
      // --------------------------------------------------------

      const loggedInUser =
        await login(
          email.trim(),
          password
        );

      // --------------------------------------------------------
      // REDIRECT
      // --------------------------------------------------------

      /*
       * If the user originally tried to access
       * a specific page, return them there.
       */

      if (redirectTo) {
        router.replace(
          redirectTo
        );

        return;
      }

      // --------------------------------------------------------
      // ROLE BASED DASHBOARD
      // --------------------------------------------------------

      switch (loggedInUser.role) {
        case "IO":
          router.replace(
            "/dashboard/io"
          );
          break;

        case "SHO":
          router.replace(
            "/dashboard/sho"
          );
          break;

        case "LEGAL_ADVISOR":
          router.replace(
            "/dashboard/legal-advisor"
          );
          break;

        default:
          router.replace(
            "/unauthorized"
          );
          break;
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Login failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen flex bg-ivory">

      {/* ====================================================== */}
      {/* LEFT PANEL */}
      {/* ====================================================== */}

      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-maroon-600 text-white px-16 py-14">

        <div>
          <span className="text-sm tracking-[0.2em] text-gold-300 font-semibold">
            CRIME OS
          </span>

          <h1 className="mt-6 font-display text-4xl leading-tight">
            Intelligence-led
            <br />
            investigations,
            <br />
            in one place.
          </h1>

          <p className="mt-6 text-maroon-100/80 max-w-sm text-sm leading-relaxed">
            Case ingestion, AI-suggested
            investigation paths, automated
            legal requests, and response
            analytics — accessible by role.
          </p>
        </div>

        <div className="text-xs text-maroon-100/60">
          Access is provisioned by your
          station administrator.
          <br />
          There is no self-registration
          on this system.
        </div>

      </div>

      {/* ====================================================== */}
      {/* LOGIN AREA */}
      {/* ====================================================== */}

      <div className="flex flex-1 items-center justify-center px-6 py-12">

        <div className="w-full max-w-sm">

          {/* Mobile logo */}

          <div className="mb-8 lg:hidden">
            <span className="text-sm tracking-[0.2em] text-maroon-600 font-semibold">
              CRIME OS
            </span>
          </div>

          {/* Heading */}

          <h2 className="font-display text-2xl text-ink-900">
            Sign in
          </h2>

          <p className="mt-1 text-sm text-ink-600">
            Use the credentials issued to
            your IO, SHO, or Legal Advisor
            account.
          </p>

          {/* ================================================== */}
          {/* FORM */}
          {/* ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            noValidate
          >

            {/* ================================================= */}
            {/* EMAIL */}
            {/* ================================================= */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-900"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-md border border-gold-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                placeholder="you@station.gov.in"
              />

            </div>

            {/* ================================================= */}
            {/* PASSWORD */}
            {/* ================================================= */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-900"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-md border border-gold-200 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                placeholder="••••••••"
              />

            </div>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {formError && (
              <p
                role="alert"
                className="text-sm text-risk bg-maroon-50 border border-maroon-200 rounded-md px-3 py-2"
              >
                {formError}
              </p>
            )}

            {/* ================================================= */}
            {/* SIGN IN BUTTON */}
            {/* ================================================= */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-maroon-600 py-2.5 text-sm font-medium text-white
                         hover:bg-maroon-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting
                ? "Signing in…"
                : "Sign in"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// LOGIN PAGE
// ============================================================

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}