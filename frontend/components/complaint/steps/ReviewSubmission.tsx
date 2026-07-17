"use client";

import { ComplaintData } from "../types";

interface Props {
  form: ComplaintData;
}

export default function ReviewSubmission({ form }: Props) {
  return (
    <div className="space-y-6 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-base font-medium text-gold-700">Final review</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink-900">Review and confirm submission</h2>
        <p className="mt-2 text-base text-ink-600">
          Confirm the incident summary, people involved, and attached evidence before sending the complaint.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gold-200 bg-ivory p-4 md:grid-cols-2">
        <div>
          <p className="text-base font-medium text-ink-600">Complaint type</p>
          <p className="mt-1 font-semibold text-ink-900">{form.complaintType || "Not provided"}</p>
        </div>
        <div>
          <p className="text-base font-medium text-ink-600">Category</p>
          <p className="mt-1 font-semibold text-ink-900">{form.category || "Not provided"}</p>
        </div>
        <div>
          <p className="text-base font-medium text-ink-600">Priority</p>
          <p className="mt-1 font-semibold text-ink-900">{form.priority || "Not provided"}</p>
        </div>
        <div>
          <p className="text-base font-medium text-ink-600">Location</p>
          <p className="mt-1 font-semibold text-ink-900">{form.location || "Not provided"}</p>
        </div>
      </div>

      {form.attachments && form.attachments.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-gold-200 bg-ivory p-4">
          <p className="text-base font-semibold text-ink-900">Attached documents</p>
          {form.attachments.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="font-semibold text-ink-900">{item.fileName}</p>
              <p className="text-base text-ink-600">{item.fileType}</p>
              {item.summary ? <p className="mt-2 text-base text-ink-600">{item.summary}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-gold-200 bg-ivory p-4">
        <p className="text-base font-semibold text-ink-900">Complainants</p>
        {form.complainants.map((entry, index) => (
          <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-ink-900">Complainant {index + 1}</p>
            <p className="text-base text-ink-600">{entry.name || "No name"}</p>
            <p className="text-base text-ink-600">Type: {entry.type || "Not provided"}</p>
            <p className="text-base text-ink-600">Contact: {entry.contact || "Not provided"}</p>
            <p className="text-base text-ink-600">Relationship: {entry.relationship || "Not provided"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-gold-200 bg-ivory p-4">
        <p className="text-base font-semibold text-ink-900">Victims</p>
        {form.victims.map((entry, index) => (
          <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-ink-900">Victim {index + 1}</p>
            <p className="text-base text-ink-600">{entry.name || "No name"}</p>
            <p className="text-base text-ink-600">Type: {entry.type || "Not provided"}</p>
            <p className="text-base text-ink-600">Contact: {entry.contact || "Not provided"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-gold-200 bg-ivory p-4">
        <p className="text-base font-semibold text-ink-900">Suspects</p>
        {form.suspects.map((entry, index) => (
          <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-ink-900">Suspect {index + 1}</p>
            <p className="text-base text-ink-600">{entry.name || "No name"}</p>
            <p className="text-base text-ink-600">Type: {entry.type || "Not provided"}</p>
            <p className="text-base text-ink-600">Status: {entry.status || "Not provided"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}