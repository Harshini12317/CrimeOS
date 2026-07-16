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
    const updated = suspects.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setSuspects(updated);
  }

  function handlePhotoUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = suspects.map((entry, i) =>
        i === index ? { ...entry, photoUrl: reader.result as string, photoName: file.name } : entry
      );
      setSuspects(updated);
    };
    reader.readAsDataURL(file);
  }

  function removeSuspect(index: number) {
    setSuspects(suspects.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-medium text-blue-600">Step 3</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Suspect details</h2>
          <p className="mt-2 text-base text-slate-500">
            Record one or more suspects, status, and identifying remarks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSuspects([...suspects, { type: "", name: "", contact: "", description: "", status: "" }])}
          className="rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-blue-700"
        >
          Add another suspect
        </button>
      </div>

      <div className="space-y-6">
        {suspects.map((suspect, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-slate-900">Suspect {index + 1}</p>
              {suspects.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSuspect(index)}
                  className="text-base font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-slate-700">Suspect type</label>
                <select
                  value={suspect.type || ""}
                  onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                >
                  <option value="">Select type</option>
                  <option value="Person">Person</option>
                  <option value="Organization">Organization</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="text-base font-medium text-slate-700">Name</label>
                <input
                  value={suspect.name}
                  onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Suspect name"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-slate-700">Contact details</label>
                <input
                  value={suspect.contact}
                  onChange={(e) => handleFieldChange(index, "contact", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Phone, email, or residence"
                />
              </div>
              <div>
                <label className="text-base font-medium text-slate-700">Status</label>
                <select
                  value={suspect.status || ""}
                  onChange={(e) => handleFieldChange(index, "status", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                >
                  <option value="">Select status</option>
                  <option value="At large">At large</option>
                  <option value="Arrested">Arrested</option>
                  <option value="Under investigation">Under investigation</option>
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">Person photo</p>
                  <p className="text-base text-slate-500">Attach a photo for this suspect when available.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-medium text-slate-700"
                >
                  <Camera size={16} />
                  Upload photo
                </button>
              </div>
              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(index, e)}
              />
              {suspect.photoUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <img src={suspect.photoUrl} alt={suspect.name || "Suspect photo"} className="h-20 w-20 rounded-2xl object-cover" />
                  <p className="text-base text-slate-600">{suspect.photoName || "Photo attached"}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="text-base font-medium text-slate-700">Description</label>
              <textarea
                rows={4}
                value={suspect.description}
                onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                placeholder="Add identifying remarks"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}