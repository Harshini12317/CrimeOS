"use client";

import { useEffect, useState } from "react";
import { ComplaintData } from "../types";

interface Props {
  form: ComplaintData;
  setForm: React.Dispatch<React.SetStateAction<ComplaintData>>;
}

export default function ComplaintDetails({ form, setForm }: Props) {
  const [crimeCategories, setCrimeCategories] = useState<
    Record<string, string[]>
  >({});

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  // ---------------------------------------------------------
  // Fetch crime categories from backend
  // ---------------------------------------------------------

  useEffect(() => {
    async function fetchCrimeCategories() {
      try {
        setLoadingCategories(true);
        setCategoryError("");

        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:8000";

        const response = await fetch(
          `${API_BASE}/api/complaints/categories`
        );

        if (!response.ok) {
          throw new Error("Failed to load crime categories.");
        }

        const data = await response.json();

        setCrimeCategories(data);
      } catch (error) {
        console.error("Category loading error:", error);

        setCategoryError(
          "Could not load crime categories. Please check the backend."
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCrimeCategories();
  }, []);

  // ---------------------------------------------------------
  // Normal input changes
  // ---------------------------------------------------------

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ---------------------------------------------------------
  // Crime category change
  // ---------------------------------------------------------

  function handleCategoryChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedCategory = e.target.value;

    setForm((prev) => ({
      ...prev,

      crimeCategory: selectedCategory,

      // Reset subcategory whenever category changes
      crimeSubcategory: "",
    }));
  }

  // ---------------------------------------------------------
  // Get subcategories for selected category
  // ---------------------------------------------------------

  const subcategories =
    form.crimeCategory &&
    crimeCategories[form.crimeCategory]
      ? crimeCategories[form.crimeCategory]
      : [];

  return (
    <div className="space-y-6">

      {/* -------------------------------------------------- */}
      {/* Heading */}
      {/* -------------------------------------------------- */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
          Step 2
        </p>

        <h2 className="mt-1 text-xl font-semibold text-ink-900">
          Complaint information
        </h2>

        <p className="mt-1 text-sm text-ink-600">
          Enter the core facts of the complaint so it can be triaged properly.
        </p>
      </div>


      {/* -------------------------------------------------- */}
      {/* Complaint Type */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          Complaint type
        </label>

        <select
          name="complaintType"
          value={form.complaintType}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
        >
          <option value="">
            Select complaint type
          </option>

          <option value="Written">
            Written
          </option>

          <option value="Verbal">
            Verbal
          </option>

          <option value="Online">
            Online
          </option>

          <option value="Phone">
            Phone
          </option>
        </select>
      </div>


      {/* -------------------------------------------------- */}
      {/* Crime Category + Subcategory */}
      {/* -------------------------------------------------- */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* Crime Category */}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">
            Crime category
          </label>

          <select
            name="crimeCategory"
            value={form.crimeCategory}
            onChange={handleCategoryChange}
            disabled={loadingCategories}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "Select crime category"}
            </option>

            {Object.keys(crimeCategories).map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          {categoryError && (
            <p className="mt-1 text-xs text-red-600">
              {categoryError}
            </p>
          )}
        </div>


        {/* Crime Subcategory */}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">
            Crime subcategory
          </label>

          <select
            name="crimeSubcategory"
            value={form.crimeSubcategory}
            onChange={handleChange}
            disabled={
              !form.crimeCategory ||
              subcategories.length === 0
            }
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {!form.crimeCategory
                ? "Select category first"
                : "Select subcategory"}
            </option>

            {subcategories.map((subcategory) => (
              <option
                key={subcategory}
                value={subcategory}
              >
                {subcategory}
              </option>
            ))}
          </select>
        </div>

      </div>


      {/* -------------------------------------------------- */}
      {/* Priority */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          Priority
        </label>

        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
        >
          <option value="Low">
            Low
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="High">
            High
          </option>

          <option value="Critical">
            Critical
          </option>
        </select>
      </div>


      {/* -------------------------------------------------- */}
      {/* Incident Date + Time */}
      {/* -------------------------------------------------- */}

      <div className="grid gap-4 md:grid-cols-2">

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">
            Incident date
          </label>

          <input
            type="date"
            name="incidentDate"
            value={form.incidentDate}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-900">
            Incident time
          </label>

          <input
            type="time"
            name="incidentTime"
            value={form.incidentTime}
            onChange={handleChange}
            className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          />
        </div>

      </div>


      {/* -------------------------------------------------- */}
      {/* Location */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          Incident location
        </label>

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="Enter incident location"
        />
      </div>


      {/* -------------------------------------------------- */}
      {/* Description */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          Incident description
        </label>

        <textarea
          rows={6}
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
          placeholder="Describe what happened"
        />
      </div>


      {/* -------------------------------------------------- */}
      {/* AI Summary */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          AI Summary / Narrative
        </label>

        <textarea
          rows={4}
          name="aiSummary"
          value={form.aiSummary}
          readOnly
          className="w-full cursor-default rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-ink-900 outline-none"
          placeholder="AI generated summary will appear here"
        />
      </div>


      {/* -------------------------------------------------- */}
      {/* Officer Notes */}
      {/* -------------------------------------------------- */}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-900">
          Officer notes
        </label>

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