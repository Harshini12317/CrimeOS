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
    <div className="space-y-6 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-base font-medium text-gold-700">Step 1</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink-900">Complaint information</h2>
        <p className="mt-2 text-base text-ink-600">
          Enter the core facts of the complaint so it can be triaged properly.
        </p>
      </div>

      <div>
        <label className="text-base font-medium text-ink-900">Complaint type</label>
        <input
          name="complaintType"
          value={form.complaintType}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          placeholder="e.g. Theft, Assault, Harassment"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-base font-medium text-ink-900">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
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
          <label className="text-base font-medium text-ink-900">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-base font-medium text-ink-900">Incident date</label>
          <input
            type="date"
            name="incidentDate"
            value={form.incidentDate}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          />
        </div>
        <div>
          <label className="text-base font-medium text-ink-900">Incident time</label>
          <input
            type="time"
            name="incidentTime"
            value={form.incidentTime}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          />
        </div>
      </div>

      <div>
        <label className="text-base font-medium text-ink-900">Incident location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          placeholder="Enter location"
        />
      </div>

      <div>
        <label className="text-base font-medium text-ink-900">Incident description</label>
        <textarea
          rows={6}
          name="description"
          value={form.description}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          placeholder="Describe what happened"
        />
      </div>

      <div>
        <label className="text-base font-medium text-ink-900">Officer notes</label>
        <textarea
          rows={3}
          name="officerNotes"
          value={form.officerNotes}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-gold-200 bg-ivory px-4 py-3 outline-none ring-0"
          placeholder="Add internal notes"
        />
      </div>
    </div>
  );
}