"use client";

import { ComplaintData } from "../types";

interface Props {
  form: ComplaintData;
}

export default function ReviewSubmission({ form }: Props) {
  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm text-sm text-ink-600">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Final review</p>
        <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Review and confirm submission</h2>
        <p className="mt-1 text-ink-600">
          Check all complaint, complainant, victim, and suspect details before submitting.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border border-gold-200 bg-ivory p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Complaint type</p>
          <p className="mt-1 font-semibold text-ink-900">{form.complaintType || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Category</p>
          <p className="mt-1 font-semibold text-ink-900">{form.category || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Priority</p>
          <p className="mt-1 font-semibold text-ink-900">{form.priority || "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-ink-600">Location</p>
          <p className="mt-1 font-semibold text-ink-900">{form.location || "Not provided"}</p>
        </div>
      </div>

      {form.attachments && form.attachments.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-gold-200 bg-ivory p-4">
          <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Attached documents</p>
          {form.attachments.map((item) => (
            <div key={item.id} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm">
              <p className="font-semibold text-ink-900">{item.fileName}</p>
              <p className="text-xs text-ink-600">{item.fileType}</p>
              {item.summary ? <p className="mt-2 text-xs text-ink-600">{item.summary}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-gold-200 bg-ivory p-4">
        <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Complainants</p>
        {form.complainants.map((entry, index) => (
          <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
            <p className="text-sm font-semibold text-ink-900">Complainant {index + 1}</p>
            <p className="text-sm text-ink-600">{entry.name || "No name"}</p>
            {entry.photoName ? <p className="text-xs text-ink-600 font-medium">Photo: {entry.photoName}</p> : null}
            <p className="text-xs text-ink-600">Contact: {entry.contact || "Not provided"}</p>
            <p className="text-xs text-ink-600">Relationship: {entry.relationship || "Not provided"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border border-gold-200 bg-ivory p-4">
        <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Victims</p>
        {form.victims.map((entry, index) => (
          <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
            <p className="text-sm font-semibold text-ink-900">Victim {index + 1}</p>
            <p className="text-sm text-ink-600">{entry.name || "No name"}</p>
            {entry.photoName ? <p className="text-xs text-ink-600 font-medium">Photo: {entry.photoName}</p> : null}
            <p className="text-xs text-ink-600">Type: {entry.type || "Not provided"}</p>
            <p className="text-xs text-ink-600">Contact: {entry.contact || "Not provided"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border border-gold-200 bg-ivory p-4">
        <p className="text-sm font-semibold text-ink-900 border-b border-gold-200 pb-2">Suspects</p>
        {form.suspects.map((entry, index) => (
          <div key={index} className="rounded-md bg-white p-3 border border-gold-100 shadow-sm space-y-1">
            <p className="text-sm font-semibold text-ink-900">Suspect {index + 1}</p>
            <p className="text-sm text-ink-600">{entry.name || "No name"}</p>
            {entry.photoName ? <p className="text-xs text-ink-600 font-medium">Photo: {entry.photoName}</p> : null}
            <p className="text-xs text-ink-600">Type: {entry.type || "Not provided"}</p>
            <p className="text-xs text-ink-600">Status: {entry.status || "Not provided"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <p className="font-semibold">Submission preview</p>
        <p className="mt-1 text-xs text-emerald-600 leading-relaxed">
          Your complaint will be saved with the current incident summary, attached evidence, and investigator notes.
        </p>
      </div>
    </div>
  );
}