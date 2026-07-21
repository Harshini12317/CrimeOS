"use client";

import { ChangeEvent, useRef } from "react";
import { Camera } from "lucide-react";
import { PersonEntry } from "../types";

interface Props {
  complainants: PersonEntry[];
  setComplainants: (complainants: PersonEntry[]) => void;
}

export default function ComplainantDetails({ complainants, setComplainants }: Props) {
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleFieldChange(index: number, field: keyof PersonEntry, value: string) {
    const updated = complainants.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
    setComplainants(updated);
  }

  function handlePhotoUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = complainants.map((entry, i) => i === index ? { ...entry, photoUrl: reader.result as string, photoName: file.name } : entry);
      setComplainants(updated);
    };
    reader.readAsDataURL(file);
  }

  function removeComplainant(index: number) {
    setComplainants(complainants.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Step 5</p>
          <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Complainant details</h2>
          <p className="mt-1 text-sm text-ink-600">Capture one or more complainants and their statements.</p>
        </div>
        <button
          type="button"
          onClick={() => setComplainants([...complainants, { type: "Individual", name: "", contact: "", relationship: "", statement: "" }])}
          className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
        >
          Add complainant
        </button>
      </div>

      <div className="space-y-4">
        {complainants.map((complainant, index) => (
          <div key={index} className="rounded-lg border border-gold-200 bg-ivory p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gold-200 pb-3 mb-4">
              <p className="text-sm font-semibold text-ink-900">Complainant {index + 1}</p>
              {complainants.length > 1 && (
                <button type="button" onClick={() => removeComplainant(index)} className="text-sm font-medium text-red-600 hover:text-red-800">
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Complainant type</label>
                <select
                  value={complainant.type || ""}
                  onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                >
                  <option value="">Select type</option>
                  <option value="Individual">Individual</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Full name</label>
                <input
                  value={complainant.name}
                  onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Enter complainant name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Contact</label>
                <input
                  value={complainant.contact}
                  onChange={(e) => handleFieldChange(index, "contact", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Phone or email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Relationship to incident</label>
                <select
                  value={complainant.relationship || ""}
                  onChange={(e) => handleFieldChange(index, "relationship", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                >
                  <option value="">Select relationship</option>
                  <option value="Self">Self (Victim)</option>
                  <option value="Witness">Witness</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-ink-900">Statement</label>
              <textarea
                rows={3}
                value={complainant.statement}
                onChange={(e) => handleFieldChange(index, "statement", e.target.value)}
                className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                placeholder="Describe the complainant’s account"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}