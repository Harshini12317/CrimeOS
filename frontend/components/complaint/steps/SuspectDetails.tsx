"use client";

import { ChangeEvent, useRef } from "react";
import { Camera } from "lucide-react";
import { PersonEntry } from "../types";

interface Props {
  suspects: PersonEntry[];
  setSuspects: (suspects: PersonEntry[]) => void;
}

export default function SuspectDetails({ suspects, setSuspects }: Props) {
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleFieldChange(index: number, field: keyof PersonEntry, value: string) {
    const updated = suspects.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
    setSuspects(updated);
  }

  function handlePhotoUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = suspects.map((entry, i) => i === index ? { ...entry, photoUrl: reader.result as string, photoName: file.name } : entry);
      setSuspects(updated);
    };
    reader.readAsDataURL(file);
  }

  function removeSuspect(index: number) {
    setSuspects(suspects.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Step 4</p>
          <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Suspect details</h2>
          <p className="mt-1 text-sm text-ink-600">Record one or more suspects, status, and identifying remarks.</p>
        </div>
        <button
          type="button"
          onClick={() => setSuspects([...suspects, { type: "Individual", name: "", contact: "", description: "", status: "Suspected" }])}
          className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
        >
          Add suspect
        </button>
      </div>

      <div className="space-y-4">
        {suspects.map((suspect, index) => (
          <div key={index} className="rounded-lg border border-gold-200 bg-ivory p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gold-200 pb-3 mb-4">
              <p className="text-sm font-semibold text-ink-900">Suspect {index + 1}</p>
              {suspects.length > 1 && (
                <button type="button" onClick={() => removeSuspect(index)} className="text-sm font-medium text-red-600 hover:text-red-800">
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Suspect type</label>
                <select
                  value={suspect.type || ""}
                  onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                >
                  <option value="">Select type</option>
                  <option value="Individual">Individual</option>
                  <option value="Organization">Organization</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Name</label>
                <input
                  value={suspect.name}
                  onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Suspect name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Contact details</label>
                <input
                  value={suspect.contact}
                  onChange={(e) => handleFieldChange(index, "contact", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Phone, email, or residence"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-900">Status</label>
                <select
                  value={suspect.status || ""}
                  onChange={(e) => handleFieldChange(index, "status", e.target.value)}
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                >
                  <option value="">Select status</option>
                  <option value="Suspected">Suspected</option>
                  <option value="Highly Suspected">Highly Suspected</option>
                  <option value="At large">At large</option>
                  <option value="Arrested">Arrested</option>
                  <option value="Under investigation">Under investigation</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-ink-900">Description & Activity</label>
              <textarea
                rows={3}
                value={suspect.description}
                onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                placeholder="Add identifying remarks, clothing, or activity"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}