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
    const updated = complainants.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setComplainants(updated);
  }

  function handlePhotoUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = complainants.map((entry, i) =>
        i === index ? { ...entry, photoUrl: reader.result as string, photoName: file.name } : entry
      );
      setComplainants(updated);
    };
    reader.readAsDataURL(file);
  }

  function removeComplainant(index: number) {
    setComplainants(complainants.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-medium text-blue-600">Step 4</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Complainant details</h2>
          <p className="mt-2 text-base text-slate-500">
            Capture one or more complainants and their statements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComplainants([...complainants, { name: "", contact: "", relationship: "", statement: "" }])}
          className="rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-blue-700"
        >
          Add another complainant
        </button>
      </div>

      <div className="space-y-6">
        {complainants.map((complainant, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-slate-900">Complainant {index + 1}</p>
              {complainants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComplainant(index)}
                  className="text-base font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-slate-700">Complainant type</label>
                <select
                  value={complainant.type || ""}
                  onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                >
                  <option value="">Select type</option>
                  <option value="Person">Person</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>
              <div>
                <label className="text-base font-medium text-slate-700">Full name</label>
                <input
                  value={complainant.name}
                  onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Enter complainant name"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-slate-700">Contact</label>
                <input
                  value={complainant.contact}
                  onChange={(e) => handleFieldChange(index, "contact", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Phone or email"
                />
              </div>
              <div>
                <label className="text-base font-medium text-slate-700">Relationship to incident</label>
                <select
                  value={complainant.relationship || ""}
                  onChange={(e) => handleFieldChange(index, "relationship", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                >
                  <option value="">Select relationship</option>
                  <option value="Victim">Victim</option>
                  <option value="Witness">Witness</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">Person photo</p>
                  <p className="text-base text-slate-500">Attach a photo for this complainant when available.</p>
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
              {complainant.photoUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <img src={complainant.photoUrl} alt={complainant.name || "Complainant photo"} className="h-20 w-20 rounded-2xl object-cover" />
                  <p className="text-base text-slate-600">{complainant.photoName || "Photo attached"}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="text-base font-medium text-slate-700">Statement</label>
              <textarea
                rows={4}
                value={complainant.statement}
                onChange={(e) => handleFieldChange(index, "statement", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0"
                placeholder="Describe the complainant’s account"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">Person photo</p>
                  <p className="text-base text-slate-500">Attach a photo for this complainant when available.</p>
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
              {complainant.photoUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <img src={complainant.photoUrl} alt={complainant.name || "Complainant photo"} className="h-20 w-20 rounded-2xl object-cover" />
                  <p className="text-base text-slate-600">{complainant.photoName || "Photo attached"}</p>
                </div>
              ) : null}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}