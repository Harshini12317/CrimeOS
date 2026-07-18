export default function DashboardIndexPage() {
  // middleware.ts redirects /dashboard to the correct role folder before
  // this ever renders. This only shows up if middleware somehow didn't
  // run (e.g. during local debugging).
  return <div className="p-8 text-ink-600">Redirecting to your dashboard…</div>;
}