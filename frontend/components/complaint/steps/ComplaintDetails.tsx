"use client";

import { ComplaintData } from "../types";

interface Props {
  form: ComplaintData;
  setForm: React.Dispatch<React.SetStateAction<ComplaintData>>;
}

export default function ComplaintDetails({ form, setForm }: Props) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Step 2</p>
        <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Complaint information</h2>
        <p className="mt-1 text-sm text-ink-600">
          Enter the core facts of the complaint so it can be triaged properly.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">Complaint type</label>
        <input
          name="complaintType"
          value={form.complaintType}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="e.g. Theft, Assault, Harassment"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          >
            <option value="">Select category</option>
            <option value="Theft">Theft</option>
            <option value="Fraud">Fraud</option>
            <option value="Cyber Crime">Cyber Crime</option>
            <option value="Accident">Accident</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">Incident date</label>
          <input
            type="date"
            name="incidentDate"
            value={form.incidentDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">Incident time</label>
          <input
            type="time"
            name="incidentTime"
            value={form.incidentTime}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">Incident location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="Enter location"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">Incident description</label>
        <textarea
          rows={6}
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="Describe what happened"
        />
      </div>

      {/* AI Summary is read-only and styled distinctively so it's clear it came from the LLM! */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">AI Summary / Narrative</label>
        <textarea
          rows={4}
          name="aiSummary"
          value={form.aiSummary}
          readOnly
          className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-ink-900 outline-none cursor-default"
          placeholder="AI generated summary will appear here"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">Officer notes</label>
        <textarea
          rows={3}
          name="officerNotes"
          value={form.officerNotes}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="Add internal notes"
        />
      </div>
    </div>
  );
}