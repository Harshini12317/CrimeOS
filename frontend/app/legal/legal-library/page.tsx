import LegalLibraryClient, { type LibrarySearchResponse } from "@/components/legal/LegalLibraryClient";

export const dynamic = "force-dynamic";

// Requires NEXT_PUBLIC_API_URL (or a server-only API_URL — same-origin per
// your answer) pointing at the FastAPI backend, e.g.
//   NEXT_PUBLIC_API_URL=http://localhost:8000   (dev)
// Backend route: backend/investigation/legal_library_router.py — mount it
// with app.include_router(router, prefix="/api/legal-library") in your
// FastAPI app first, or this fetch will 404.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function searchLibrary(params: {
  q?: string;
  act_code?: string;
  category?: string;
}): Promise<LibrarySearchResponse> {
  const url = new URL(`${API_BASE}/api/legal-library/search`);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.act_code) url.searchParams.set("act_code", params.act_code);
  if (params.category) url.searchParams.set("category", params.category);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Legal library search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export default async function LegalLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; act?: string; category?: string }>;
}) {
  const params = await searchParams;
  const actCode = params.act && params.act !== "ALL" ? params.act : undefined;

  const data = await searchLibrary({
    q: params.q,
    act_code: actCode,
    category: params.category,
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-maroon-900">Legal Library</h1>
        <p className="text-sm text-gray-600 mt-1">Search BNS/BNSS/BSA sections and case law.</p>
      </div>

      <LegalLibraryClient
        data={data}
        initialQuery={params.q ?? ""}
        initialAct={(params.act as any) ?? "ALL"}
      />
    </div>
  );
}