// "use client";

// import { useMemo, useState } from "react";
// import axios from "axios";
// import { CheckCircle2 } from "lucide-react";
// import { useLanguage } from "@/app/providers/LanguageProvider";
// import Stepper from "./Stepper";
// import ComplaintDetails from "./steps/ComplaintDetails";
// import VictimDetails from "./steps/VictimDetails";
// import SuspectDetails from "./steps/SuspectDetails";
// import ComplainantDetails from "./steps/ComplainantDetails";
// import ReviewSubmission from "./steps/ReviewSubmission";
// import DocumentsAndEvidence from "./steps/DocumentsAndEvidence";
// import NavigationButtons from "./NavigationButtons";
// import { ComplaintData } from "./types";

// const initialForm: ComplaintData = {
//   complaintType: "",
//   category: "",
//   priority: "Medium",
//   incidentDate: "",
//   incidentTime: "",
//   location: "",
//   description: "",
//   aiSummary: "",
//   officerNotes: "",
//   complainants: [{ type: "", name: "", contact: "", relationship: "", statement: "" }],
//   victims: [{ type: "", name: "", contact: "", statement: "" }],
//   suspects: [{ type: "", name: "", contact: "", description: "", status: "" }],
//   attachments: [],
// };

// export default function ComplaintWizard() {
//   const { t } = useLanguage();
//   const [step, setStep] = useState(1);
//   const [form, setForm] = useState<ComplaintData>(initialForm);
//   const [submitted, setSubmitted] = useState(false);

//   const totalSteps = 6;
//   const progressLabel = useMemo(() => `${t("navigation.step", "complaints")} ${step} ${t("navigation.of", "complaints")} ${totalSteps}`, [step, t]);

//   function handleNext() {
//     if (step < totalSteps) setStep(step + 1);
//   }

//   function handleBack() {
//     if (step > 1) setStep(step - 1);
//   }

//   async function handleSubmit() {
//     try {
//       const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
//       await axios.post(`${API_BASE}/api/complaints/submit`, form);
//       setSubmitted(true);
//     } catch (error) {
//       console.error(error);
//       alert("Submission failed. Please verify the backend is running.");
//     }
//   }

//   function addVictim() {
//     setForm((prev) => ({ ...prev, victims: [...prev.victims, { type: "", name: "", contact: "", statement: "" }] }));
//     setStep(3);
//   }

//   function addSuspect() {
//     setForm((prev) => ({ ...prev, suspects: [...prev.suspects, { type: "", name: "", contact: "", description: "", status: "" }] }));
//     setStep(4);
//   }

//   function addComplainant() {
//     setForm((prev) => ({ ...prev, complainants: [...prev.complainants, { type: "", name: "", contact: "", relationship: "", statement: "" }] }));
//     setStep(5);
//   }

//   function setVictims(victims: ComplaintData["victims"]) {
//     setForm((prev) => ({ ...prev, victims }));
//   }

//   function setSuspects(suspects: ComplaintData["suspects"]) {
//     setForm((prev) => ({ ...prev, suspects }));
//   }

//   function setComplainants(complainants: ComplaintData["complainants"]) {
//     setForm((prev) => ({ ...prev, complainants }));
//   }

//   if (submitted) {
//     return (
//       <div className="mx-auto flex max-w-6xl flex-col items-center justify-center rounded-[32px] border border-emerald-200 bg-white p-10 text-center shadow-xl">
//         <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
//           <CheckCircle2 className="h-10 w-10" />
//         </div>
//         <h1 className="mt-6 text-3xl font-semibold text-ink-900">Complaint registered successfully</h1>
//         <p className="mt-3 max-w-xl text-base text-ink-600">
//           The complaint has been saved to the registry and is ready for review by the assigned team.
//         </p>
//         <button
//           onClick={() => {
//             setSubmitted(false);
//             setStep(1);
//             setForm(initialForm);
//           }}
//           className="mt-8 rounded-full bg-maroon-700 px-5 py-3 text-base font-medium text-white transition hover:bg-maroon-800"
//         >
//           Register another complaint
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-full rounded-[32px] border border-gold-200 bg-white/90 p-6 text-base shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div className="max-w-3xl">
//           <p className="text-base font-semibold uppercase tracking-[0.3em] text-gold-700">Complaint register</p>
//           <h1 className="mt-2 text-3xl font-semibold text-ink-900">Register a new complaint</h1>
//           <p className="mt-3 text-base text-ink-600">
//             Follow the guided steps below to capture evidence, complainant information, and case notes in one place.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <button
//             type="button"
//             onClick={addVictim}
//             className="rounded-full border border-gold-200 bg-ivory px-4 py-2 text-base text-ink-900 transition hover:border-gold-300 hover:text-gold-700"
//           >
//             Add victim
//           </button>
//           <button
//             type="button"
//             onClick={addSuspect}
//             className="rounded-full border border-gold-200 bg-ivory px-4 py-2 text-base text-ink-900 transition hover:border-gold-300 hover:text-gold-700"
//           >
//             Add suspect
//           </button>
//           <button
//             type="button"
//             onClick={addComplainant}
//             className="rounded-full border border-gold-200 bg-ivory px-4 py-2 text-base text-ink-900 transition hover:border-gold-300 hover:text-gold-700"
//           >
//             Add complainant
//           </button>
//           <button
//             type="button"
//             onClick={() => setStep(2)}
//             className="rounded-full border border-maroon-700 bg-maroon-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-maroon-800"
//           >
//             Complaint details
//           </button>
//         </div>
//       </div>

//       <div className="mt-6 flex items-center justify-between gap-4">
//         <div className="rounded-2xl border border-gold-200 bg-ivory px-4 py-3 text-base text-ink-600">
//           {progressLabel}
//         </div>
//         <div className="text-base text-ink-600">
//           {t("navigation.tip", "complaints", "Complete each section carefully.")}
//         </div>
//       </div>

//       <div className="mt-8">
//         <Stepper currentStep={step} />
//       </div>

//       <div className="mt-10">
//         {step === 1 && <DocumentsAndEvidence onDocumentsSubmit={(uploadedFiles) => { const newAttachments = uploadedFiles.map((file) => ({ id: String(file.id), fileName: file.file.name, fileType: file.file.type || "Unknown", documentUrl: file.cloudinaryUrl })); setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] })); }} />}
//         {step === 2 && <ComplaintDetails form={form} setForm={setForm} />}
//         {step === 3 && <VictimDetails victims={form.victims} setVictims={setVictims} />}
//         {step === 4 && <SuspectDetails suspects={form.suspects} setSuspects={setSuspects} />}
//         {step === 5 && <ComplainantDetails complainants={form.complainants} setComplainants={setComplainants} />}
//         {step === 6 && <ReviewSubmission form={form} />}
//       </div>

//       <NavigationButtons
//         currentStep={step}
//         totalSteps={totalSteps}
//         onBack={handleBack}
//         onNext={handleNext}
//         onSubmit={handleSubmit}
//       />
//     </div>
//   );
// }



"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, RotateCcw } from "lucide-react";
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

const initialForm: ComplaintData = {
  complaintType: "", category: "", priority: "Medium", incidentDate: "", incidentTime: "", location: "", description: "", aiSummary: "", officerNotes: "",
  complainants: [{ type: "Individual", name: "", contact: "", relationship: "", statement: "" }],
  victims: [{ type: "Individual", name: "", contact: "", statement: "" }],
  suspects: [{ type: "Individual", name: "", contact: "", description: "", status: "Suspected" }],
  attachments: [],
};

export default function ComplaintWizard() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ComplaintData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  
  // THE PERSISTENT MEMORY
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingExtraction, setLoadingExtraction] = useState(false);
  
  // This is the HIDDEN STATE that stores the rich combined JSON
  const [masterAiJson, setMasterAiJson] = useState<any>(null);

  const totalSteps = 6;
  const progressLabel = useMemo(() => `${t("navigation.step", "complaints")} ${step} ${t("navigation.of", "complaints")} ${totalSteps}`, [step, t]);

  // THE MASTER AGENT ORCHESTRATOR
  async function handleExtractClick() {
    setLoadingExtraction(true);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
      
      // If master is null (wiped or fresh), we process ALL files.
      // If master exists, we only process the LAST added file to save time!
      const filesToProcess = masterAiJson === null ? uploadedFiles : [uploadedFiles[uploadedFiles.length - 1]];
      
      let runningMaster = masterAiJson;

      for (const item of filesToProcess) {
        const targetFile = item.file;
        const formData = new FormData();
        formData.append("file", targetFile);

        let endpoint = `${API_BASE}/v1/pdf/upload/`;
        if (targetFile.type.startsWith("audio/")) endpoint = `${API_BASE}/v1/audio/upload/`;
        else if (targetFile.type.startsWith("image/")) endpoint = `${API_BASE}/v1/image/upload/`;

        const response = await fetch(endpoint, { method: "POST", body: formData });
        if (!response.ok) throw new Error("Backend extraction failed.");
        const extractedJson = await response.json();

        // INCREMENTAL MERGE LOGIC
        if (runningMaster === null) {
          runningMaster = extractedJson; // First file sets the base
        } else {
          console.log("Merging new evidence into Master JSON...");
          const mergeResponse = await fetch(`${API_BASE}/v1/combo/merge/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              current_master: runningMaster,
              new_evidence: extractedJson
            })
          });
          if (mergeResponse.ok) {
            runningMaster = await mergeResponse.json();
          }
        }
      }

      setMasterAiJson(runningMaster);

      // Map to UI...
      const isImageOnly = "scene" in runningMaster && !("sections" in runningMaster);

      setForm((prev) => {
        if (isImageOnly) {
          return {
            ...prev,
            location: runningMaster?.scene?.location_type || prev.location,
            description: runningMaster?.scene?.summary || prev.description,
            aiSummary: `Visual Evidence Analysis. Weather: ${runningMaster?.scene?.weather || "Unknown"}.`,
            suspects: runningMaster?.people?.map((person: any) => ({
              type: "Individual", name: "Unknown Suspect", contact: "", status: "Suspected",
              description: `Activity: ${person.activity}. Details: ${person.description}.`,
            })) || prev.suspects
          };
        } else {
          const extractedSuspects = runningMaster?.sections?.accused_details?.map((accused: any) => ({
            type: "Individual", name: accused.name || "Unknown Suspect", contact: "", status: "Suspected",
            description: accused.description || "",
          })) || prev.suspects;

          return {
            ...prev,
            location: runningMaster?.sections?.incident_details?.location || prev.location,
            description: runningMaster?.sections?.incident_details?.description || prev.description,
            aiSummary: runningMaster?.sections?.narrative_text || prev.aiSummary,
            incidentDate: runningMaster?.sections?.incident_details?.date || prev.incidentDate,
            suspects: extractedSuspects
          };
        }
      });

      alert("Evidence Extracted and Merged Successfully!");
      setStep(2); 

    } catch (error) {
      console.error(error);
      alert("Error extracting data. Is the backend running?");
    } finally {
      setLoadingExtraction(false);
    }
  }

  // Handle File Deletions (Wipes the Master JSON!)
  function handleFilesChange(newFiles: UploadedFile[]) {
    if (newFiles.length < uploadedFiles.length) {
      // User deleted a file. Wipe the master JSON to prevent hallucinations.
      setMasterAiJson(null);
      alert("A file was removed. The Master AI analysis has been reset. Please click Extract again when ready.");
    }
    setUploadedFiles(newFiles);
  }

  // Handle Manual Resets
  function resetAllData() {
    if (confirm("Are you sure you want to clear all evidence and forms?")) {
      setUploadedFiles([]);
      setMasterAiJson(null);
      setForm(initialForm);
      setStep(1);
    }
  }

  async function handleSubmit() {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      // Merge the hidden Master JSON with the Officer's edits!
      const finalPayload = {
        officer_form_edits: form,
        ai_master_record: masterAiJson 
      };
      
      await axios.post(`${API_BASE}/api/complaints/submit`, finalPayload);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please verify the backend is running.");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center rounded-[32px] border border-emerald-200 bg-white p-10 text-center shadow-xl">
        <div className="rounded-full bg-emerald-100 p-4 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
        <h1 className="mt-6 text-3xl font-semibold text-ink-900">Complaint registered successfully</h1>
        <button onClick={() => { setSubmitted(false); setStep(1); setForm(initialForm); setUploadedFiles([]); setMasterAiJson(null); }} className="mt-8 rounded-full bg-maroon-700 px-5 py-3 text-base font-medium text-white transition hover:bg-maroon-800">
          Register another complaint
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto rounded-[32px] border border-gold-200 bg-white/90 p-6 text-base shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4">
            <p className="text-base font-semibold uppercase tracking-[0.3em] text-gold-700">Complaint register</p>
            {uploadedFiles.length > 0 && (
               <button onClick={resetAllData} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition">
                 <RotateCcw className="h-3 w-3" /> Clear Data
               </button>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Register a new complaint</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStep(2)} className="rounded-full border border-maroon-700 bg-maroon-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-maroon-800">
            Complaint details
          </button>
        </div>
      </div>

      <div className="mt-8"><Stepper currentStep={step} /></div>

      <div className="mt-10">
        {step === 1 && (
          <DocumentsAndEvidence 
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            onExtractClick={handleExtractClick}
            loading={loadingExtraction}
          />
        )}
        {step === 2 && <ComplaintDetails form={form} setForm={setForm} />}
        {step === 3 && <VictimDetails victims={form.victims} setVictims={(v) => setForm(p => ({...p, victims: v}))} />}
        {step === 4 && <SuspectDetails suspects={form.suspects} setSuspects={(s) => setForm(p => ({...p, suspects: s}))} />}
        {step === 5 && <ComplainantDetails complainants={form.complainants} setComplainants={(c) => setForm(p => ({...p, complainants: c}))} />}
        {step === 6 && <ReviewSubmission form={form} />}
      </div>

      <NavigationButtons currentStep={step} totalSteps={totalSteps} onBack={() => {if(step>1) setStep(step-1)}} onNext={() => {if(step<totalSteps) setStep(step+1)}} onSubmit={handleSubmit} />
    </div>
  );
}