"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  createComplainant,
  createVictim,
  createSuspect,
} from "./api";

import { useLanguage } from "@/app/providers/LanguageProvider";

import Stepper from "./Stepper";
import ComplaintDetails from "./steps/ComplaintDetails";
import VictimDetails from "./steps/VictimDetails";
import SuspectDetails from "./steps/SuspectDetails";
import ComplainantDetails from "./steps/ComplainantDetails";
import ReviewSubmission from "./steps/ReviewSubmission";
import DocumentsAndEvidence from "./steps/DocumentsAndEvidence";
import NavigationButtons from "./NavigationButtons";

import { ComplaintData, UploadedFile } from "./types";


// ============================================================
// INITIAL FORM
// ============================================================

const initialForm: ComplaintData = {
  complaintType: "",

  crimeCategory: "",
  crimeSubcategory: "",

  priority: "Medium",

  incidentDate: "",
  incidentTime: "",

  location: "",
  description: "",

  aiSummary: "",
  officerNotes: "",

  complainants: [
    {
      type: "Individual",
      name: "",
      contact: "",
      relationship: "",
      statement: "",
    },
  ],

  victims: [
    {
      type: "Individual",
      name: "",
      contact: "",
      statement: "",
    },
  ],

  suspects: [
    {
      type: "Individual",
      name: "",
      contact: "",
      description: "",
      status: "Suspected",
    },
  ],

  attachments: [],
};


// ============================================================
// COMPONENT
// ============================================================

export default function ComplaintWizard() {
  const { t } = useLanguage();

  const [step, setStep] = useState(1);

  const [form, setForm] =
    useState<ComplaintData>(initialForm);

  const [submitted, setSubmitted] = useState(false);

  const [registeredComplaintNumber, setRegisteredComplaintNumber] =
    useState<string | null>(null);


  // ==========================================================
  // FILE / AI STATE
  // ==========================================================

  const [uploadedFiles, setUploadedFiles] =
    useState<UploadedFile[]>([]);

  const [loadingExtraction, setLoadingExtraction] =
    useState(false);

  const [masterAiJson, setMasterAiJson] =
    useState<any>(null);


  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
    submessage?: string;
  } | null>(null);


  // ==========================================================
  // STEPS
  // ==========================================================

  const totalSteps = 6;

  const progressLabel = useMemo(
  () => `Step ${step} of ${totalSteps}`,
  [step]
);


  // ==========================================================
  // API BASE URL
  // ==========================================================

  /*
   * Keep API_BASE as the backend ROOT.
   *
   * Example:
   * NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   *
   * Then:
   *
   * Complaint API:
   * http://localhost:8000/api/complaints
   *
   * PDF:
   * http://localhost:8000/api/v1/pdf/upload/
   *
   * Audio:
   * http://localhost:8000/api/v1/audio/upload/
   */

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";


  // ==========================================================
  // EXTRACT EVIDENCE (PERFECTED MASTER AGENT)
  // ==========================================================

  async function handleExtractClick() {
    if (uploadedFiles.length === 0) {
      setNotification({
        type: "error",
        message: "No Evidence Selected",
        submessage: "Please upload at least one PDF, image, or audio file.",
      });
      return;
    }

    setLoadingExtraction(true);
    setNotification(null);

    try {
      const filesToProcess =
        masterAiJson === null
          ? uploadedFiles
          : [uploadedFiles[uploadedFiles.length - 1]];

      let runningMaster = masterAiJson;
      let lastFileFormat = "";

      // ------------------------------------------------------
      // 1. Process files through specific ingestion
      // ------------------------------------------------------
      for (const item of filesToProcess) {
        const targetFile = item.file;
        const formData = new FormData();
        formData.append("file", targetFile);

        let endpoint = `${API_BASE}/api/v1/pdf/upload/`;

        if (targetFile.type.startsWith("audio/")) {
          endpoint = `${API_BASE}/api/v1/audio/upload/`;
          lastFileFormat = "Audio";
        } else if (targetFile.type.startsWith("image/")) {
          endpoint = `${API_BASE}/api/v1/image/upload/`;
          lastFileFormat = "Image";
        } else {
          lastFileFormat = "PDF";
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Evidence extraction failed (${response.status}).`);
        }

        const extractedJson = await response.json();

        if (extractedJson?.error) {
          throw new Error(extractedJson.error.message || "Schema validation failed.");
        }

        // ----------------------------------------------------
        // 2. FORCE EVERYTHING THROUGH MASTER COMBO AGENT
        // ----------------------------------------------------
        console.log("Normalizing extracted evidence through Master Agent...");

        const mergeResponse = await fetch(`${API_BASE}/api/v1/combo/merge/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_master: runningMaster || {},
            new_evidence: extractedJson,
          }),
        });

        if (!mergeResponse.ok) {
          throw new Error("Failed to normalize evidence through Master Agent.");
        }

        runningMaster = await mergeResponse.json();
        if (filesToProcess.length > 1 || masterAiJson !== null) {
          lastFileFormat = "Merged";
        }
      }

      if (!runningMaster) {
        throw new Error("No information could be extracted from the evidence.");
      }

      setMasterAiJson(runningMaster);

      // ======================================================
      // MAP MASTER JSON → FORM (PERFECTED REFINEMENT)
      // ======================================================

      let rawDate = runningMaster?.sections?.incident_details?.date || "";
      let formattedDate = "";
      if (rawDate) {
        const dateMatch = rawDate.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/) || rawDate.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (dateMatch) {
          if (dateMatch[1].length === 4) {
            formattedDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          } else {
            formattedDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
          }
        }
      }

      setForm((prev) => {
        const extractedSuspects =
          runningMaster?.sections?.accused_details?.map((accused: any) => ({
            type: "Individual",
            name: accused.name || "Unknown Suspect",
            contact: "",
            status: "Suspected",
            address: accused.address || "",
            description: accused.description || "",
          })) || prev.suspects;

        const complainantName = runningMaster?.sections?.complainant_details?.name || "";
        const complainantPhone = runningMaster?.sections?.complainant_details?.phone || "";
        const complainantAddr = 
          runningMaster?.sections?.complainant_details?.address || 
          runningMaster?.sections?.incident_details?.location || "";

        const incidentDesc = runningMaster?.sections?.incident_details?.description || "";
        const narrativeRaw = runningMaster?.sections?.narrative_text || "";

        // 1. MAKE AI SUMMARY DISTINCT: Use key_facts bullet points if available!
        const keyFactsSummary = runningMaster?.key_facts?.length > 0
          ? runningMaster.key_facts.map((fact: string) => `• ${fact}`).join("\n")
          : narrativeRaw || incidentDesc;

        // 2. MAKE COMPLAINANT STATEMENT DISTINCT
        const complainantStatement = narrativeRaw 
          ? `Complainant formal account: ${narrativeRaw}`
          : "Formal statement recorded as per complaint.";

        // 3. MAKE VICTIM STATEMENT DISTINCT
        const victimStatement = incidentDesc
          ? `Victim account of property loss/incident: ${incidentDesc}`
          : "Victim account recorded.";

        const extractedComplainant = {
          type: "Individual",
          relationship: "Self",
          name: complainantName,
          contact: complainantPhone,
          address: complainantAddr,
          statement: complainantStatement, // NOW DISTINCT!
        };

        const autoVictim = {
          type: "Individual",
          name: complainantName,
          contact: complainantPhone,
          address: complainantAddr,
          relationship: "Self",
          statement: victimStatement, // NOW DISTINCT!
        };

        return {
          ...prev,
          location: runningMaster?.sections?.incident_details?.location || prev.location,
          description: incidentDesc || prev.description,
          aiSummary: keyFactsSummary || prev.aiSummary, // NOW BULLET POINTS!
          incidentDate: formattedDate || prev.incidentDate,
          incidentTime: runningMaster?.sections?.incident_details?.time || prev.incidentTime,
          complainants: complainantName ? [extractedComplainant] : prev.complainants,
          victims: complainantName ? [autoVictim] : prev.victims,
          suspects: extractedSuspects,
        };
      });

      // ======================================================
      // 4. NOTIFICATION
      // ======================================================

      if (lastFileFormat === "PDF") {
        setNotification({
          type: "success",
          message: "PDF Complaint Processed",
          submessage: "Successfully extracted written complainant details, timeline, and incident notes.",
        });
      } else if (lastFileFormat === "Audio") {
        setNotification({
          type: "success",
          message: "Voice Complaint Transcribed",
          submessage: "Speech-to-text completed and mapped to the complaint form.",
        });
      } else if (lastFileFormat === "Image") {
        setNotification({
          type: "success",
          message: "Visual Evidence Analyzed",
          submessage: "Analyzed visual evidence and extracted complainant/incident details.",
        });
      } else {
        setNotification({
          type: "success",
          message: "Evidence Successfully Merged",
          submessage: "The extracted information was consolidated into the complaint form.",
        });
      }

      setStep(2);

    } catch (error: any) {
      console.error("Evidence extraction error:", error);
      setNotification({
        type: "error",
        message: "Extraction Failed",
        submessage: error?.message || "Could not extract evidence. Please check the backend.",
      });
    } finally {
      setLoadingExtraction(false);
    }
  }
  
  // ==========================================================
  // FILE CHANGES
  // ==========================================================

  function handleFilesChange(
    newFiles: UploadedFile[]
  ) {

    /*
     * If a file is removed, the existing AI master
     * can no longer be trusted.
     */

    if (
      newFiles.length <
      uploadedFiles.length
    ) {
      setMasterAiJson(null);

      setNotification({
        type: "error",

        message:
          "Evidence Removed",

        submessage:
          "The Master AI analysis was reset. Please click Extract again.",
      });
    }


    setUploadedFiles(
      newFiles
    );
  }


  // ==========================================================
  // RESET
  // ==========================================================

  function resetAllData() {

    if (
      !confirm(
        "Are you sure you want to clear all evidence and reset this form?"
      )
    ) {
      return;
    }


    setUploadedFiles([]);

    setMasterAiJson(null);

    setNotification(null);

    setRegisteredComplaintNumber(null);

    setForm(initialForm);

    setStep(1);

    setSubmitted(false);
  }


  // ==========================================================
  // SUBMIT COMPLAINT
  // ==========================================================

  async function handleSubmit() {
  setNotification(null);

  try {
    // ======================================================
    // 1. FRONTEND VALIDATION
    // ======================================================

    if (!form.complaintType) {
      throw new Error(
        "Please select a complaint type."
      );
    }

    if (!form.crimeCategory) {
      throw new Error(
        "Please select a crime category."
      );
    }

    if (!form.crimeSubcategory) {
      throw new Error(
        "Please select a crime subcategory."
      );
    }

    if (!form.description.trim()) {
      throw new Error(
        "Please enter the incident description."
      );
    }


    // ======================================================
    // 2. CREATE COMPLAINT
    // ======================================================

    const complaintPayload = {
      complaint_type:
        form.complaintType,

      crime_category:
        form.crimeCategory,

      crime_subcategory:
        form.crimeSubcategory,

      priority:
        form.priority,

      incident_date:
        form.incidentDate || null,

      incident_time:
        form.incidentTime || null,

      location:
        form.location.trim() || null,

      description:
        form.description.trim(),

      ai_summary:
        form.aiSummary.trim() || null,

      officer_notes:
        form.officerNotes.trim() || null,
    };


    console.log(
      "Creating complaint:",
      complaintPayload
    );


    const complaintResponse =
      await axios.post(
        `${API_BASE}/api/complaints`,
        complaintPayload
      );


    console.log(
      "Complaint created:",
      complaintResponse.data
    );


    // ======================================================
    // 3. GET COMPLAINT ID
    // ======================================================

    const complaintId =
      complaintResponse.data.complaint_id;

    const complaintNumber =
      complaintResponse.data.complaint_number;


    if (!complaintId) {
      throw new Error(
        "Complaint was created but complaint_id was not returned by the backend."
      );
    }


    console.log(
      "Complaint ID:",
      complaintId
    );


    // ======================================================
    // 4. SAVE VICTIMS
    // ======================================================

    const validVictims =
      form.victims.filter(
        (victim) =>
          victim.name &&
          victim.name.trim()
      );


    for (
      const victim of validVictims
    ) {

      await createVictim(
        complaintId,
        victim
      );

    }


    console.log(
      `Saved ${validVictims.length} victim(s)`
    );


    // ======================================================
    // 5. SAVE SUSPECTS
    // ======================================================

    const validSuspects =
      form.suspects.filter(
        (suspect) =>
          suspect.name &&
          suspect.name.trim()
      );


    for (
      const suspect of validSuspects
    ) {

      await createSuspect(
        complaintId,
        suspect
      );

    }


    console.log(
      `Saved ${validSuspects.length} suspect(s)`
    );


    // ======================================================
    // 6. SAVE COMPLAINANTS
    // ======================================================

    const validComplainants =
      form.complainants.filter(
        (complainant) =>
          complainant.name &&
          complainant.name.trim()
      );


    for (
      const complainant of validComplainants
    ) {

      await createComplainant(
        complaintId,
        complainant
      );

    }


    console.log(
      `Saved ${validComplainants.length} complainant(s)`
    );


    // ======================================================
    // 7. STORE COMPLAINT NUMBER
    // ======================================================

    setRegisteredComplaintNumber(
      complaintNumber
    );


    // ======================================================
    // 8. SUCCESS
    // ======================================================

    setNotification({
      type: "success",

      message:
        "Complaint Registered Successfully",

      submessage:
        `Complaint Number: ${complaintNumber}`,
    });


    setSubmitted(true);


  } catch (error: any) {

    console.error(
      "Complaint submission failed:",
      error
    );


    let message =
      "Could not save the complaint.";


    if (
      error?.response?.data?.detail
    ) {

      message =
        error.response.data.detail;

    } else if (
      error?.message
    ) {

      message =
        error.message;

    }


    setNotification({
      type: "error",

      message:
        "Submission Failed",

      submessage:
        message,
    });
  }
}


  // ==========================================================
  // SUCCESS SCREEN
  // ==========================================================

  if (submitted) {

    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-lg border border-gold-200 bg-white p-10 text-center shadow-md">

        <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>


        <h1 className="mt-6 text-3xl font-semibold text-ink-900">
          Complaint registered successfully
        </h1>


        {registeredComplaintNumber && (
          <div className="mt-6 rounded-lg border border-gold-200 bg-ivory px-8 py-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">
              Complaint Number
            </p>

            <p className="mt-1 text-2xl font-bold text-maroon-700">
              {registeredComplaintNumber}
            </p>

          </div>
        )}


        <p className="mt-4 max-w-xl text-base text-ink-600">
          The complaint has been saved successfully to the CrimeOS registry.
        </p>


        <button
          type="button"
          onClick={() => {

            setSubmitted(false);

            setRegisteredComplaintNumber(null);

            setStep(1);

            setForm(initialForm);

            setUploadedFiles([]);

            setMasterAiJson(null);

            setNotification(null);
          }}
          className="mt-8 rounded-md border border-maroon-600 bg-maroon-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-maroon-700"
        >
          Register another complaint
        </button>

      </div>
    );
  }


  // ==========================================================
  // MAIN WIZARD
  // ==========================================================

  return (
    <div className="w-full rounded-lg border border-gold-200 bg-white p-5 text-sm text-ink-600 shadow-sm">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
            Complaint Register
          </p>

          <h1 className="mt-1 text-2xl font-display text-ink-900">
            Register a new complaint
          </h1>

          <p className="mt-1 text-ink-600">
            Guided steps to capture evidence, complainant information, and case notes.
          </p>

        </div>


        <div className="flex items-center gap-2">

          {uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={resetAllData}
              className="flex items-center gap-1.5 rounded-md border border-gold-300 bg-ivory px-4 py-2 text-sm text-ink-900 transition-colors hover:bg-gold-50"
            >
              <RotateCcw className="h-4 w-4 text-ink-600" />
              Reset Form
            </button>
          )}


          <button
            type="button"
            onClick={() => {
              setNotification(null);
              setStep(2);
            }}
            className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
          >
            Complaint details
          </button>

        </div>

      </div>


      {/* ==================================================== */}
      {/* PROGRESS */}
      {/* ==================================================== */}

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-gold-100 pt-4">

        <div className="rounded-md border border-gold-200 bg-ivory px-3 py-1.5 text-xs text-ink-600">
          {progressLabel}
        </div>

        <div className="text-xs text-ink-600">
          Complete each section carefully.
        </div>

      </div>


      {/* ==================================================== */}
      {/* STEPPER */}
      {/* ==================================================== */}

      <div className="mt-6">
        <Stepper currentStep={step} />
      </div>


      {/* ==================================================== */}
      {/* NOTIFICATION */}
      {/* ==================================================== */}

      {notification && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >

          {notification.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          )}


          <div>

            <p className="font-semibold text-ink-900">
              {notification.message}
            </p>

            {notification.submessage && (
              <p className="mt-0.5 text-xs opacity-90">
                {notification.submessage}
              </p>
            )}

          </div>

        </div>
      )}


      {/* ==================================================== */}
      {/* CURRENT STEP */}
      {/* ==================================================== */}

      <div className="mt-8">

        {step === 1 && (
          <DocumentsAndEvidence
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            onExtractClick={handleExtractClick}
            loading={loadingExtraction}
          />
        )}


        {step === 2 && (
          <ComplaintDetails
            form={form}
            setForm={setForm}
          />
        )}


        {step === 3 && (
          <VictimDetails
            victims={form.victims}
            setVictims={(v) =>
              setForm((p) => ({
                ...p,
                victims: v,
              }))
            }
          />
        )}


        {step === 4 && (
          <SuspectDetails
            suspects={form.suspects}
            setSuspects={(s) =>
              setForm((p) => ({
                ...p,
                suspects: s,
              }))
            }
          />
        )}


        {step === 5 && (
          <ComplainantDetails
            complainants={form.complainants}
            setComplainants={(c) =>
              setForm((p) => ({
                ...p,
                complainants: c,
              }))
            }
          />
        )}


        {step === 6 && (
          <ReviewSubmission
            form={form}
          />
        )}

      </div>


      {/* ==================================================== */}
      {/* NAVIGATION */}
      {/* ==================================================== */}

      <NavigationButtons
        currentStep={step}
        totalSteps={totalSteps}

        onBack={() => {
          if (step > 1) {
            setNotification(null);
            setStep(step - 1);
          }
        }}

        onNext={() => {
          if (step < totalSteps) {
            setNotification(null);
            setStep(step + 1);
          }
        }}

        onSubmit={handleSubmit}
      />

    </div>
  );
}