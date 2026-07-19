"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FaMagnifyingGlass, FaBookBookmark, FaGavel, FaChevronDown, FaChevronUp, FaCodeCompare } from "react-icons/fa6";

export type ActCode = "BNS" | "BNSS" | "BSA";

export interface Crosswalk {
  new_act: string;
  new_section: string;
  old_act: string; // IPC | CrPC | IEA
  old_section: string;
  subject: string | null;
  summary_of_comparison: string | null;
}

export interface Landmark {
  id: string;
  case_id: string | null;
  case_title: string | null;
  court: string | null;
  case_date: string | null;
  crime_type: string | null;
  bail_outcome: string | null;
  bail_outcome_detailed: string | null;
  summary: string | null;
  legal_principles_discussed: string | null;
  ipc_sections: string | null;
  similarity: number | null;
}

export interface LibrarySection {
  id: string;
  act_code: ActCode;
  section_number: string;
  title: string | null;
  section_text: string;
  category: string | null;
  similarity: number | null;
  crosswalk: Crosswalk[];
  related_landmarks: Landmark[];
}

export interface LibrarySearchResponse {
  sections: LibrarySection[];
  semantic_landmarks: Landmark[];
}

const ACT_BADGE_STYLE: Record<string, string> = {
  BNS: "bg-maroon-50 text-maroon-800 border border-maroon-200",
  BNSS: "bg-gold-50 text-gold-700 border border-gold-300",
  BSA: "bg-stone-100 text-stone-700 border border-stone-300",
};

export default function LegalLibraryClient({
  data,
  initialQuery,
  initialAct,
}: {
  data: LibrarySearchResponse;
  initialQuery: string;
  initialAct: ActCode | "ALL";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [activeAct, setActiveAct] = useState<ActCode | "ALL">(initialAct);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pushParams(next: { q?: string; act?: ActCode | "ALL" }) {
    const params = new URLSearchParams(searchParams.toString());
    const q = next.q ?? query;
    const act = next.act ?? activeAct;

    if (q) params.set("q", q);
    else params.delete("q");

    if (act && act !== "ALL") params.set("act", act);
    else params.delete("act");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleActClick(act: ActCode | "ALL") {
    setActiveAct(act);
    pushParams({ act });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ q: query });
  }

  return (
    <>
      {/* Search + filters */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-gold-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="relative">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by offence or fact pattern — semantic search (e.g. 'phishing bank fraud', 'chain snatching')"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            {(["ALL", "BNS", "BNSS", "BSA"] as const).map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => handleActClick(act)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  activeAct === act
                    ? "bg-maroon-800 text-gold-200 border-maroon-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gold-400 hover:text-maroon-800"
                }`}
              >
                {act === "ALL" ? "All Acts" : act}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-maroon-800 text-gold-200 hover:bg-maroon-700 disabled:opacity-50"
          >
            {isPending ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Section results */}
      <div className="space-y-3">
        {data.sections.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-16 bg-white border border-gold-200 rounded-lg">
            No sections match your search. Try a different keyword, or switch acts.
          </div>
        )}

        {data.sections.map((section) => {
          const isOpen = expandedId === section.id;
          return (
            <div key={section.id} className="bg-white border border-gold-200 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : section.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${ACT_BADGE_STYLE[section.act_code]}`}>
                      {section.act_code} §{section.section_number}
                    </span>
                    {section.crosswalk.map((cw, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium text-gray-500 flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5"
                      >
                        <FaCodeCompare className="text-[10px]" />
                        {cw.old_act} §{cw.old_section}
                      </span>
                    ))}
                    {section.category && (
                      <span className="text-[11px] text-gray-400 truncate max-w-xs">{section.category}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {section.title ?? "Untitled section"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{section.section_text}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                    <FaGavel className="text-[10px]" />
                    <span>
                      {section.related_landmarks.length} related case{" "}
                      {section.related_landmarks.length === 1 ? "law" : "laws"}
                    </span>
                    {section.similarity !== null && (
                      <span className="ml-2">· {Math.round(section.similarity * 100)}% match</span>
                    )}
                  </div>
                </div>
                <div className="pt-1 text-gray-400">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
              </button>

              {isOpen && (
                <div className="border-t border-gold-100 bg-ivory/60 px-5 py-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.section_text}</p>
                  </div>

                  {section.crosswalk.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-maroon-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FaCodeCompare className="text-[10px]" /> Old Act Equivalent
                      </p>
                      <div className="space-y-2">
                        {section.crosswalk.map((cw, i) => (
                          <div key={i} className="bg-white border border-gray-100 rounded-md p-3">
                            <p className="text-sm font-semibold text-gray-800">
                              {cw.old_act} §{cw.old_section}
                              {cw.subject ? ` — ${cw.subject}` : ""}
                            </p>
                            {cw.summary_of_comparison && (
                              <p className="text-xs text-gray-600 mt-1">{cw.summary_of_comparison}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.related_landmarks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-maroon-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FaBookBookmark className="text-[10px]" /> Related Case Law
                      </p>
                      <div className="space-y-2">
                        {section.related_landmarks.map((l) => (
                          <LandmarkCard key={l.id} landmark={l} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pure semantic case-law matches (fact-pattern search, not tied to a listed section) */}
      {data.semantic_landmarks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-maroon-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <FaGavel className="text-xs" /> Judgments Matching Your Search
          </h2>
          <div className="space-y-2">
            {data.semantic_landmarks.map((l) => (
              <LandmarkCard key={l.id} landmark={l} showSimilarity />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function LandmarkCard({ landmark, showSimilarity }: { landmark: Landmark; showSimilarity?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-md p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">{landmark.case_title ?? "Untitled judgment"}</p>
        {landmark.case_date && <span className="text-xs text-gray-400">{landmark.case_date}</span>}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {[landmark.court, landmark.crime_type, landmark.bail_outcome].filter(Boolean).join(" · ")}
      </p>
      {landmark.summary && <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{landmark.summary}</p>}
      {showSimilarity && landmark.similarity !== null && (
        <p className="text-[11px] text-gold-700 mt-1">{Math.round(landmark.similarity * 100)}% match</p>
      )}
    </div>
  );
}