"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

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
  // EXTRACT EVIDENCE
  // ==========================================================

  async function handleExtractClick() {
    if (uploadedFiles.length === 0) {
      setNotification({
        type: "error",
        message: "No Evidence Selected",
        submessage:
          "Please upload at least one PDF, image, or audio file.",
      });

      return;
    }

    setLoadingExtraction(true);
    setNotification(null);

    try {
      /*
       * If no master exists:
       * process all files.
       *
       * If master already exists:
       * process only the newest file.
       */

      const filesToProcess =
        masterAiJson === null
          ? uploadedFiles
          : [
              uploadedFiles[
                uploadedFiles.length - 1
              ],
            ];


      let runningMaster = masterAiJson;

      let lastFileFormat = "";


      // ------------------------------------------------------
      // Process files
      // ------------------------------------------------------

      for (const item of filesToProcess) {
        const targetFile = item.file;

        const formData = new FormData();

        formData.append(
          "file",
          targetFile
        );


        let endpoint = `${API_BASE}/api/v1/pdf/upload/`;


        if (targetFile.type.startsWith("audio/")) {
          endpoint =
            `${API_BASE}/api/v1/audio/upload/`;

          lastFileFormat = "Audio";

        } else if (
          targetFile.type.startsWith("image/")
        ) {
          endpoint =
            `${API_BASE}/api/v1/image/upload/`;

          lastFileFormat = "Image";

        } else {
          lastFileFormat = "PDF";
        }


        const response = await fetch(
          endpoint,
          {
            method: "POST",
            body: formData,
          }
        );


        if (!response.ok) {
          throw new Error(
            `Evidence extraction failed (${response.status}).`
          );
        }


        const extractedJson =
          await response.json();


        // ----------------------------------------------------
        // Backend schema error
        // ----------------------------------------------------

        if (extractedJson?.error) {
          throw new Error(
            extractedJson.error.message ||
              "Schema validation failed."
          );
        }


        // ----------------------------------------------------
        // First file
        // ----------------------------------------------------

        if (runningMaster === null) {
          runningMaster = extractedJson;
        }

        // ----------------------------------------------------
        // Additional files → merge
        // ----------------------------------------------------

        else {
          const mergeResponse =
            await fetch(
              `${API_BASE}/api/v1/combo/merge/`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  current_master:
                    runningMaster,

                  new_evidence:
                    extractedJson,
                }),
              }
            );


          if (!mergeResponse.ok) {
            throw new Error(
              "Failed to merge extracted evidence."
            );
          }


          runningMaster =
            await mergeResponse.json();

          lastFileFormat = "Merged";
        }
      }


      // ------------------------------------------------------
      // Make sure something was extracted
      // ------------------------------------------------------

      if (!runningMaster) {
        throw new Error(
          "No information could be extracted from the evidence."
        );
      }


      setMasterAiJson(
        runningMaster
      );


      // ======================================================
      // MAP AI RESULT → FORM
      // ======================================================

      const isImageOnly =
        typeof runningMaster === "object" &&
        runningMaster !== null &&
        "scene" in runningMaster &&
        !("sections" in runningMaster);


      setForm((prev) => {

        // ----------------------------------------------------
        // IMAGE
        // ----------------------------------------------------

        if (isImageOnly) {
          return {
            ...prev,

            location:
              runningMaster?.scene
                ?.location_type ||
              prev.location,

            description:
              runningMaster?.scene
                ?.summary ||
              prev.description,

            aiSummary:
              `Visual Evidence Analysis. Weather: ${
                runningMaster?.scene?.weather ||
                "Unknown"
              }. Lighting: ${
                runningMaster?.scene?.lighting ||
                "Unknown"
              }.`,


            suspects:
              runningMaster?.people?.map(
                (person: any) => ({
                  type: "Individual",

                  name:
                    "Unknown Suspect",

                  contact: "",

                  status:
                    "Suspected",

                  description:
                    `Activity: ${
                      person.activity ||
                      "Unknown"
                    }. Details: ${
                      person.description ||
                      "Unknown"
                    }.`,
                })
              ) || prev.suspects,
          };
        }


        // ----------------------------------------------------
        // PDF / AUDIO / COMBINED
        // ----------------------------------------------------

        const extractedSuspects =
          runningMaster?.sections
            ?.accused_details
            ?.map((accused: any) => ({
              type: "Individual",

              name:
                accused.name ||
                "Unknown Suspect",

              contact: "",

              status:
                "Suspected",

              description:
                accused.description ||
                "",
            })) ||
          prev.suspects;


        return {
          ...prev,

          location:
            runningMaster?.sections
              ?.incident_details
              ?.location ||
            prev.location,

          description:
            runningMaster?.sections
              ?.incident_details
              ?.description ||
            prev.description,

          aiSummary:
            runningMaster?.sections
              ?.narrative_text ||
            prev.aiSummary,

          incidentDate:
            runningMaster?.sections
              ?.incident_details
              ?.date ||
            prev.incidentDate,


          complainants: [
            {
              type: "Individual",

              relationship: "Self",

              name:
                runningMaster?.sections
                  ?.complainant_details
                  ?.name || "",

              contact:
                runningMaster?.sections
                  ?.complainant_details
                  ?.phone || "",

              statement:
                `Address: ${
                  runningMaster?.sections
                    ?.complainant_details
                    ?.address ||
                  "N/A"
                }.`,
            },
          ],


          suspects:
            extractedSuspects,
        };
      });


      // ======================================================
      // NOTIFICATION
      // ======================================================

      if (lastFileFormat === "PDF") {
        setNotification({
          type: "success",

          message:
            "PDF Complaint Processed",

          submessage:
            "Successfully extracted written complainant details, timeline, and incident notes.",
        });

      } else if (
        lastFileFormat === "Audio"
      ) {
        setNotification({
          type: "success",

          message:
            "Voice Complaint Transcribed",

          submessage:
            "Speech-to-text completed and the extracted information was mapped to the complaint form.",
        });

      } else if (
        lastFileFormat === "Image"
      ) {
        setNotification({
          type: "success",

          message:
            "Visual Evidence Analyzed",

          submessage:
            "The visual evidence was analyzed and relevant information was mapped to the complaint form.",
        });

      } else {
        setNotification({
          type: "success",

          message:
            "Evidence Successfully Merged",

          submessage:
            "The extracted information was consolidated into the complaint form.",
        });
      }


      // ------------------------------------------------------
      // Move to complaint details
      // ------------------------------------------------------

      setStep(2);

    } catch (error: any) {
      console.error(
        "Evidence extraction error:",
        error
      );

      setNotification({
        type: "error",

        message:
          "Extraction Failed",

        submessage:
          error?.message ||
          "Could not extract evidence. Please check the backend.",
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

      // ------------------------------------------------------
      // Frontend validation
      // ------------------------------------------------------

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
      // PAYLOAD MATCHING FASTAPI ComplaintCreate
      // ======================================================

      const payload = {

        complaint_type:
          form.complaintType,

        crime_category:
          form.crimeCategory,

        crime_subcategory:
          form.crimeSubcategory,

        priority:
          form.priority,

        incident_date:
          form.incidentDate ||
          null,

        incident_time:
          form.incidentTime ||
          null,

        location:
          form.location.trim() ||
          null,

        description:
          form.description.trim(),

        ai_summary:
          form.aiSummary.trim() ||
          null,

        officer_notes:
          form.officerNotes.trim() ||
          null,
      };


      console.log(
        "Submitting complaint:",
        payload
      );


      // ======================================================
      // POST TO NEW BACKEND
      // ======================================================

      const response =
        await axios.post(
          `${API_BASE}/api/complaints`,
          payload
        );


      console.log(
        "Complaint registered:",
        response.data
      );


      // ======================================================
      // STORE COMPLAINT NUMBER
      // ======================================================

      setRegisteredComplaintNumber(
        response.data.complaint_number
      );


      setNotification({
        type: "success",

        message:
          "Complaint Registered Successfully",

        submessage:
          `Complaint Number: ${response.data.complaint_number}`,
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