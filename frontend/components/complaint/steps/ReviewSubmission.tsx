"use client";

import { ComplaintData } from "../types";

interface Props {
  form: ComplaintData;
}

export default function ReviewSubmission({ form }: Props) {
  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Step 6</p>
        <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Review and confirm</h2>
        <p className="mt-1 text-sm text-ink-600">
          Confirm the incident summary, people involved, and attached evidence before submitting.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-gold-200 bg-ivory p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Complaint Category</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{form.crimeCategory || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Crime Subcategory</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{form.crimeSubcategory || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Priority</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{form.priority || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Location</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{form.location || "Not provided"}</p>
        </div>
      </div>

      {form.attachments && form.attachments.length > 0 && (
        <div className="space-y-3 rounded-lg border border-gold-200 bg-ivory p-4">
          <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Attached documents</p>
          {form.attachments.map((item) => (
            <div key={item.id} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm">
              <p className="text-sm font-medium text-ink-900">{item.fileName}</p>
              <p className="text-xs text-ink-600">{item.fileType}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Complainants Column */}
        <div className="space-y-3 rounded-lg border border-gold-200 bg-ivory p-4">
          <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Complainants</p>
          {form.complainants.map((entry, index) => (
            <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
              <p className="text-sm font-medium text-ink-900">{entry.name || `Complainant ${index + 1}`}</p>
              <p className="text-xs text-ink-600">Contact: {entry.contact || "N/A"}</p>
            </div>
          ))}
        </div>

        {/* Victims Column */}
        <div className="space-y-3 rounded-lg border border-gold-200 bg-ivory p-4">
          <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Victims</p>
          {form.victims.map((entry, index) => (
            <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
              <p className="text-sm font-medium text-ink-900">{entry.name || `Victim ${index + 1}`}</p>
              <p className="text-xs text-ink-600">Contact: {entry.contact || "N/A"}</p>
            </div>
          ))}
        </div>

        {/* Suspects Column */}
        <div className="space-y-3 rounded-lg border border-gold-200 bg-ivory p-4">
          <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Suspects</p>
          {form.suspects.map((entry, index) => (
            <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
              <p className="text-sm font-medium text-ink-900">{entry.name || `Suspect ${index + 1}`}</p>
              <p className="text-xs text-ink-600">Status: {entry.status || "N/A"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}