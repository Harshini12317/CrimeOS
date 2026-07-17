"use client";

import { ChangeEvent, useRef } from "react";
import { Camera } from "lucide-react";
import { PersonEntry } from "../types";

interface Props {
  victims: PersonEntry[];
  setVictims: (victims: PersonEntry[]) => void;
}

export default function VictimDetails({ victims, setVictims }: Props) {
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handleFieldChange(index: number, field: keyof PersonEntry, value: string) {
    const updated = victims.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setVictims(updated);
  }

  function handlePhotoUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = victims.map((entry, i) =>
        i === index ? { ...entry, photoUrl: reader.result as string, photoName: file.name } : entry
      );
      setVictims(updated);
    };
    reader.readAsDataURL(file);
  }

  function removeVictim(index: number) {
    setVictims(victims.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-medium text-gold-700">Step 2</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink-900">Victim details</h2>
          <p className="mt-2 text-base text-ink-600">
            Add one or more victims and include any protective notes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVictims([...victims, { type: "", name: "", contact: "", statement: "" }])}
          className="rounded-full border border-maroon-700 bg-maroon-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-maroon-800"
        >
          Add another victim
        </button>
      </div>

      <div className="space-y-6">
        {victims.map((victim, index) => (
          <div key={index} className="rounded-3xl border border-gold-200 bg-ivory p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-base font-semibold text-ink-900">Victim {index + 1}</p>
              {victims.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVictim(index)}
                  className="text-base font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-ink-900">Victim type</label>
                <select
                  value={victim.type || ""}
                  onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gold-200 bg-white px-4 py-3 outline-none ring-0"
                >
                  <option value="">Select type</option>
                  <option value="Person">Person</option>
                  <option value="Organization">Organization</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="text-base font-medium text-ink-900">Name</label>
                <input
                  value={victim.name}
                  onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gold-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Victim name"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-gold-300 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink-900">Person photo</p>
                  <p className="text-base text-ink-600">Attach a photo for this victim when available.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className="flex items-center gap-2 rounded-full border border-gold-200 bg-ivory px-4 py-2 text-base font-medium text-ink-900"
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
              {victim.photoUrl ? (
                <div className="mt-4 flex items-center gap-4">
                  <img src={victim.photoUrl} alt={victim.name || "Victim photo"} className="h-20 w-20 rounded-2xl object-cover" />
                  <p className="text-base text-ink-600">{victim.photoName || "Photo attached"}</p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <div>
                <label className="text-base font-medium text-ink-900">Contact details</label>
                <input
                  value={victim.contact}
                  onChange={(e) => handleFieldChange(index, "contact", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gold-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Phone, email, or address"
                />
              </div>
              <div>
                <label className="text-base font-medium text-ink-900">Statement</label>
                <textarea
                  rows={4}
                  value={victim.statement}
                  onChange={(e) => handleFieldChange(index, "statement", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gold-200 bg-white px-4 py-3 outline-none ring-0"
                  placeholder="Record victim account"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}