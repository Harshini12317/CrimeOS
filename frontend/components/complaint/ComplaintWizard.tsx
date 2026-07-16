"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import Stepper from "./Stepper";
import ComplaintDetails from "./steps/ComplaintDetails";
import VictimDetails from "./steps/VictimDetails";
import SuspectDetails from "./steps/SuspectDetails";
import ComplainantDetails from "./steps/ComplainantDetails";
import ReviewSubmission from "./steps/ReviewSubmission";
import DocumentsAndEvidence from "./steps/DocumentsAndEvidence";
import NavigationButtons from "./NavigationButtons";
import { ComplaintData } from "./types";

const initialForm: ComplaintData = {
  complaintType: "",
  category: "",
  priority: "Medium",
  incidentDate: "",
  incidentTime: "",
  location: "",
  description: "",
  aiSummary: "",
  officerNotes: "",
  complainants: [{ type: "", name: "", contact: "", relationship: "", statement: "" }],
  victims: [{ type: "", name: "", contact: "", statement: "" }],
  suspects: [{ type: "", name: "", contact: "", description: "", status: "" }],
  attachments: [],
};

export default function ComplaintWizard() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ComplaintData>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 6;
  const progressLabel = useMemo(() => `${t("navigation.step", "complaints")} ${step} ${t("navigation.of", "complaints")} ${totalSteps}`, [step, t]);

  function handleNext() {
    if (step < totalSteps) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      await axios.post(`${API_BASE}/api/complaints/submit`, form);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please verify the backend is running.");
    }
  }

  function addVictim() {
    setForm((prev) => ({ ...prev, victims: [...prev.victims, { type: "", name: "", contact: "", statement: "" }] }));
    setStep(3);
  }

  function addSuspect() {
    setForm((prev) => ({ ...prev, suspects: [...prev.suspects, { type: "", name: "", contact: "", description: "", status: "" }] }));
    setStep(4);
  }

  function addComplainant() {
    setForm((prev) => ({ ...prev, complainants: [...prev.complainants, { type: "", name: "", contact: "", relationship: "", statement: "" }] }));
    setStep(5);
  }

  function setVictims(victims: ComplaintData["victims"]) {
    setForm((prev) => ({ ...prev, victims }));
  }

  function setSuspects(suspects: ComplaintData["suspects"]) {
    setForm((prev) => ({ ...prev, suspects }));
  }

  function setComplainants(complainants: ComplaintData["complainants"]) {
    setForm((prev) => ({ ...prev, complainants }));
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-[32px] border border-emerald-200 bg-white p-10 text-center shadow-xl">
        <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-900">Complaint registered successfully</h1>
        <p className="mt-3 max-w-xl text-base text-slate-600">
          The complaint has been saved to the registry and is ready for review by the assigned team.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(1);
            setForm(initialForm);
          }}
          className="mt-8 rounded-full bg-blue-600 px-5 py-3 text-base font-medium text-white transition hover:bg-blue-700"
        >
          Register another complaint
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full rounded-[32px] border border-slate-200 bg-white/90 p-6 text-base shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-semibold uppercase tracking-[0.3em] text-blue-600">Complaint register</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Register a new complaint</h1>
          <p className="mt-3 text-base text-slate-600">
            Follow the guided steps below to capture evidence, complainant information, and case notes in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addVictim}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Add victim
          </button>
          <button
            type="button"
            onClick={addSuspect}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Add suspect
          </button>
          <button
            type="button"
            onClick={addComplainant}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Add complainant
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Complaint details
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600">
          {progressLabel}
        </div>
        <div className="text-base text-slate-500">
          {t("navigation.tip", "complaints", "Complete each section carefully.")}
        </div>
      </div>

      <div className="mt-8">
        <Stepper currentStep={step} />
      </div>

      <div className="mt-10">
        {step === 1 && <DocumentsAndEvidence onDocumentsSubmit={(uploadedFiles) => { const newAttachments = uploadedFiles.map((file) => ({ id: file.id, fileName: file.file.name, fileType: file.file.type || "Unknown", documentUrl: file.cloudinaryUrl })); setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] })); }} />}
        {step === 2 && <ComplaintDetails form={form} setForm={setForm} />}
        {step === 3 && <VictimDetails victims={form.victims} setVictims={setVictims} />}
        {step === 4 && <SuspectDetails suspects={form.suspects} setSuspects={setSuspects} />}
        {step === 5 && <ComplainantDetails complainants={form.complainants} setComplainants={setComplainants} />}
        {step === 6 && <ReviewSubmission form={form} />}
      </div>

      <NavigationButtons
        currentStep={step}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}