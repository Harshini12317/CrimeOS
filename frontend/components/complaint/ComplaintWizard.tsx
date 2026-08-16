"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

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

import Stepper from "./Stepper";

import ComplaintDetails from "./steps/ComplaintDetails";
import VictimDetails from "./steps/VictimDetails";
import SuspectDetails from "./steps/SuspectDetails";
import ComplainantDetails from "./steps/ComplainantDetails";
import ReviewSubmission from "./steps/ReviewSubmission";
import DocumentsAndEvidence from "./steps/DocumentsAndEvidence";

import NavigationButtons from "./NavigationButtons";

import {
  ComplaintData,
  UploadedFile,
  PersonEntry,
} from "./types";


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


  // ----------------------------------------------------------
  // COMPLAINANT
  // ----------------------------------------------------------

  complainants: [
    {
      type: "Individual",

      name: "",

      contact: "",

      relationship: "",

      statement: "",

      address: "",
    },
  ],


  // ----------------------------------------------------------
  // VICTIM
  // ----------------------------------------------------------

  victims: [
    {
      type: "Individual",

      name: "",

      contact: "",

      relationship: "",

      statement: "",

      address: "",

      description: "",
    },
  ],


  // ----------------------------------------------------------
  // SUSPECT
  // ----------------------------------------------------------

  suspects: [
    {
      type: "Individual",

      name: "",

      contact: "",

      description: "",

      status: "Suspected",

      address: "",
    },
  ],


  attachments: [],
};


// ============================================================
// COMPONENT
// ============================================================

export default function ComplaintWizard() {

  const [step, setStep] =
    useState(1);


  const [form, setForm] =
    useState<ComplaintData>(
      initialForm
    );


  const [submitted, setSubmitted] =
    useState(false);


  const [
    registeredComplaintNumber,
    setRegisteredComplaintNumber,
  ] = useState<string | null>(
    null
  );


  // ==========================================================
  // EVIDENCE / AI STATE
  // ==========================================================

  const [
    uploadedFiles,
    setUploadedFiles,
  ] = useState<UploadedFile[]>(
    []
  );


  const [
    loadingExtraction,
    setLoadingExtraction,
  ] = useState(false);


  const [
    masterAiJson,
    setMasterAiJson,
  ] = useState<any>(null);


  // ==========================================================
  // SUBMISSION STATE
  // ==========================================================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  /*
   * IMPORTANT:
   *
   * React state updates are asynchronous.
   *
   * Therefore we use a ref as an immediate lock.
   *
   * This prevents:
   *
   * Click 1
   * Click 2 immediately
   *
   * from creating two complaints.
   */

  const isSubmittingRef =
    useRef(false);


  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  const [
    notification,
    setNotification,
  ] = useState<{
    type:
      | "success"
      | "error";

    message: string;

    submessage?: string;
  } | null>(null);


  // ==========================================================
  // STEPS
  // ==========================================================

  const totalSteps = 6;


  const progressLabel =
    useMemo(
      () =>
        `Step ${step} of ${totalSteps}`,
      [step]
    );


  // ==========================================================
  // API BASE
  // ==========================================================

  const API_BASE =
    process.env
      .NEXT_PUBLIC_BACKEND_API_URL ||
    "http://localhost:8000";


  // ==========================================================
  // FASTAPI ERROR HELPER
  // ==========================================================

  function getErrorMessage(
    error: any,
    fallback: string
  ): string {

    const detail =
      error?.response?.data?.detail;


    /*
     * Normal FastAPI error:
     *
     * {
     *   "detail": "Complaint not found"
     * }
     */

    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }


    /*
     * FastAPI validation error:
     *
     * {
     *   "detail": [
     *      {
     *        "loc": [...],
     *        "msg": "Field required"
     *      }
     *   ]
     * }
     */

    if (
      Array.isArray(detail)
    ) {

      return detail
        .map(
          (
            item: any
          ) => {

            const location =
              Array.isArray(
                item?.loc
              )
                ? item.loc.join(
                    " → "
                  )
                : "Request";


            const message =
              item?.msg ||
              "Validation error";


            return `${location}: ${message}`;
          }
        )
        .join("\n");
    }


    /*
     * Generic object error
     */

    if (detail) {

      try {

        return JSON.stringify(
          detail
        );

      } catch {

        return fallback;
      }
    }


    /*
     * JavaScript Error
     */

    if (
      typeof error?.message ===
      "string"
    ) {

      return error.message;
    }


    return fallback;
  }


  // ==========================================================
  // GET EXTRACTED TEXT
  // ==========================================================

  function getExtractedText(
    extraction: any
  ): string {

    if (!extraction) {
      return "";
    }


    /*
     * PDF / Audio
     */

    const narrativeText =
      extraction
        ?.sections
        ?.narrative_text;


    if (
      typeof narrativeText ===
        "string" &&
      narrativeText.trim()
    ) {

      return narrativeText;
    }


    /*
     * Generic extracted text
     */

    if (
      typeof extraction?.text ===
        "string" &&
      extraction.text.trim()
    ) {

      return extraction.text;
    }


    if (
      typeof extraction
        ?.extracted_text ===
        "string" &&
      extraction.extracted_text.trim()
    ) {

      return extraction.extracted_text;
    }


    /*
     * Image extraction
     */

    const sceneSummary =
      extraction
        ?.scene
        ?.summary;


    if (
      typeof sceneSummary ===
        "string" &&
      sceneSummary.trim()
    ) {

      return sceneSummary;
    }


    return "";
  }


  // ==========================================================
  // GET EVIDENCE SUMMARY
  // ==========================================================

  function getEvidenceSummary(
    extraction: any
  ): string {

    if (!extraction) {
      return "";
    }


    /*
     * Key facts
     */

    if (
      Array.isArray(
        extraction?.key_facts
      ) &&
      extraction.key_facts.length >
        0
    ) {

      return extraction.key_facts
        .map(
          (fact: any) =>
            String(fact)
        )
        .join("\n");
    }


    /*
     * Image summary
     */

    if (
      typeof extraction
        ?.scene
        ?.summary ===
      "string"
    ) {

      return extraction.scene.summary;
    }


    /*
     * Incident description
     */

    if (
      typeof extraction
        ?.sections
        ?.incident_details
        ?.description ===
      "string"
    ) {

      return extraction
        .sections
        .incident_details
        .description;
    }


    return "";
  }


  // ==========================================================
  // EXTRACT EVIDENCE
  // ==========================================================

  async function handleExtractClick() {

    if (
      uploadedFiles.length ===
      0
    ) {

      setNotification({
        type: "error",

        message:
          "No Evidence Selected",

        submessage:
          "Please upload at least one PDF, image, or audio file.",
      });

      return;
    }


    setLoadingExtraction(
      true
    );

    setNotification(
      null
    );


    try {

      /*
       * First extraction:
       *
       * process all files.
       *
       * Subsequent extraction:
       *
       * process only newest file.
       */

      const filesToProcess =
        masterAiJson === null
          ? uploadedFiles
          : [
              uploadedFiles[
                uploadedFiles.length -
                  1
              ],
            ];


      let runningMaster =
        masterAiJson;


      let lastFileFormat =
        "";


      /*
       * We maintain a local copy because React state
       * updates are asynchronous.
       */

      let updatedFiles =
        [...uploadedFiles];


      // ======================================================
      // PROCESS FILES
      // ======================================================

      for (
        const item of filesToProcess
      ) {

        const targetFile =
          item.file;


        const formData =
          new FormData();


        formData.append(
          "file",
          targetFile
        );


        // ----------------------------------------------------
        // DETERMINE ENDPOINT
        // ----------------------------------------------------

        let endpoint =
          `${API_BASE}/api/v1/pdf/upload/`;


        if (
          targetFile.type.startsWith(
            "audio/"
          )
        ) {

          endpoint =
            `${API_BASE}/api/v1/audio/upload/`;

          lastFileFormat =
            "Audio";

        } else if (
          targetFile.type.startsWith(
            "image/"
          )
        ) {

          endpoint =
            `${API_BASE}/api/v1/image/upload/`;

          lastFileFormat =
            "Image";

        } else {

          lastFileFormat =
            "PDF";
        }


        // ----------------------------------------------------
        // INDIVIDUAL EXTRACTION
        // ----------------------------------------------------

        const response =
          await fetch(
            endpoint,
            {
              method: "POST",

              body: formData,
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Evidence extraction failed (${response.status}).`
          );
        }


        const extractedJson =
          await response.json();


        if (
          extractedJson?.error
        ) {

          throw new Error(
            extractedJson
              ?.error
              ?.message ||
              "Schema validation failed."
          );
        }


        // ----------------------------------------------------
        // SAVE EXTRACTION TO FILE
        // ----------------------------------------------------

        updatedFiles =
          updatedFiles.map(
            (currentFile) =>
              currentFile.id ===
              item.id
                ? {
                    ...currentFile,

                    extraction:
                      extractedJson,
                  }
                : currentFile
          );


        // ====================================================
        // MASTER COMBO AGENT
        // ====================================================

        console.log(
          "Normalizing extracted evidence through Master Agent..."
        );


        const mergeResponse =
          await fetch(
            `${API_BASE}/api/v1/combo/merge/`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  current_master:
                    runningMaster ||
                    {},

                  new_evidence:
                    extractedJson,
                }),
            }
          );


        if (
          !mergeResponse.ok
        ) {

          throw new Error(
            "Failed to normalize evidence through Master Agent."
          );
        }


        runningMaster =
          await mergeResponse.json();


        if (
          filesToProcess.length >
            1 ||
          masterAiJson !== null
        ) {

          lastFileFormat =
            "Merged";
        }
      }


      // ======================================================
      // UPDATE FILE STATE
      // ======================================================

      setUploadedFiles(
        updatedFiles
      );


      if (!runningMaster) {

        throw new Error(
          "No information could be extracted from the evidence."
        );
      }


      setMasterAiJson(
        runningMaster
      );


      // ======================================================
      // DATE FORMAT
      // ======================================================

      const rawDate =
        runningMaster
          ?.sections
          ?.incident_details
          ?.date ||
        "";


      let formattedDate =
        "";


      if (rawDate) {

        const dateMatch =
          rawDate.match(
            /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/
          ) ||
          rawDate.match(
            /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
          );


        if (dateMatch) {

          if (
            dateMatch[1]
              .length === 4
          ) {

            formattedDate =
              `${dateMatch[1]}-${dateMatch[2].padStart(
                2,
                "0"
              )}-${dateMatch[3].padStart(
                2,
                "0"
              )}`;

          } else {

            formattedDate =
              `${dateMatch[3]}-${dateMatch[2].padStart(
                2,
                "0"
              )}-${dateMatch[1].padStart(
                2,
                "0"
              )}`;
          }
        }
      }


      // ======================================================
      // MAP MASTER JSON → FORM
      // ======================================================

      setForm(
        (prev) => {

          // --------------------------------------------------
          // EXTRACT SUSPECTS
          // --------------------------------------------------

          const extractedSuspects =
            runningMaster
              ?.sections
              ?.accused_details
              ?.map(
                (
                  accused: any
                ) => {

                  /*
                   * Try to preserve photo information if
                   * the same suspect already exists.
                   */

                  const existingSuspect =
                    prev.suspects.find(
                      (
                        existing
                      ) =>
                        existing.name
                          ?.trim()
                          .toLowerCase() ===
                        accused.name
                          ?.trim()
                          .toLowerCase()
                    );


                  return {
                    type:
                      "Individual",

                    name:
                      accused.name ||
                      "Unknown Suspect",

                    contact:
                      existingSuspect
                        ?.contact ||
                      "",

                    status:
                      existingSuspect
                        ?.status ||
                      "Suspected",

                    address:
                      accused.address ||
                      existingSuspect
                        ?.address ||
                      "",

                    description:
                      accused.description ||
                      existingSuspect
                        ?.description ||
                      "",

                    photoFile:
                      existingSuspect
                        ?.photoFile,

                    photoName:
                      existingSuspect
                        ?.photoName,

                    photoUrl:
                      existingSuspect
                        ?.photoUrl,
                  };
                }
              ) ||
            prev.suspects;


          // --------------------------------------------------
          // COMPLAINANT
          // --------------------------------------------------

          const complainantName =
            runningMaster
              ?.sections
              ?.complainant_details
              ?.name ||
            "";


          const complainantPhone =
            runningMaster
              ?.sections
              ?.complainant_details
              ?.phone ||
            "";


          const complainantAddr =
            runningMaster
              ?.sections
              ?.complainant_details
              ?.address ||
            runningMaster
              ?.sections
              ?.incident_details
              ?.location ||
            "";


          // --------------------------------------------------
          // INCIDENT
          // --------------------------------------------------

          const incidentDesc =
            runningMaster
              ?.sections
              ?.incident_details
              ?.description ||
            "";


          const narrativeRaw =
            runningMaster
              ?.sections
              ?.narrative_text ||
            "";


          // --------------------------------------------------
          // AI SUMMARY
          // --------------------------------------------------

          const keyFactsSummary =
            runningMaster
              ?.key_facts
              ?.length > 0

              ? runningMaster.key_facts
                  .map(
                    (
                      fact: string
                    ) =>
                      `• ${fact}`
                  )
                  .join("\n")

              : narrativeRaw ||
                incidentDesc;


          // --------------------------------------------------
          // COMPLAINANT STATEMENT
          // --------------------------------------------------

          const complainantStatement =
            narrativeRaw
              ? `Complainant formal account: ${narrativeRaw}`
              : "Formal statement recorded as per complaint.";


          // --------------------------------------------------
          // VICTIM STATEMENT
          // --------------------------------------------------

          const victimStatement =
            incidentDesc
              ? `Victim account of property loss/incident: ${incidentDesc}`
              : "Victim account recorded.";


          // --------------------------------------------------
          // EXISTING PHOTO
          // --------------------------------------------------

          const existingVictim =
            prev.victims[0];


          // --------------------------------------------------
          // EXTRACTED COMPLAINANT
          // --------------------------------------------------

          const extractedComplainant =
            {
              type:
                "Individual",

              relationship:
                "Self",

              name:
                complainantName,

              contact:
                complainantPhone,

              address:
                complainantAddr,

              statement:
                complainantStatement,

              photoFile:
                prev.complainants[0]
                  ?.photoFile,

              photoName:
                prev.complainants[0]
                  ?.photoName,

              photoUrl:
                prev.complainants[0]
                  ?.photoUrl,
            };


          // --------------------------------------------------
          // AUTO VICTIM
          // --------------------------------------------------

          const autoVictim =
            {
              type:
                "Individual",

              name:
                complainantName,

              contact:
                complainantPhone,

              address:
                complainantAddr,

              relationship:
                "Self",

              statement:
                victimStatement,

              description:
                existingVictim
                  ?.description ||
                "",

              photoFile:
                existingVictim
                  ?.photoFile,

              photoName:
                existingVictim
                  ?.photoName,

              photoUrl:
                existingVictim
                  ?.photoUrl,
            };


          return {
            ...prev,

            location:
              runningMaster
                ?.sections
                ?.incident_details
                ?.location ||
              prev.location,

            description:
              incidentDesc ||
              prev.description,

            aiSummary:
              keyFactsSummary ||
              prev.aiSummary,

            incidentDate:
              formattedDate ||
              prev.incidentDate,

            incidentTime:
              runningMaster
                ?.sections
                ?.incident_details
                ?.time ||
              prev.incidentTime,

            complainants:
              complainantName
                ? [
                    extractedComplainant,
                  ]
                : prev.complainants,

            victims:
              complainantName
                ? [autoVictim]
                : prev.victims,

            suspects:
              extractedSuspects,
          };
        }
      );


      // ======================================================
      // NOTIFICATION
      // ======================================================

      if (
        lastFileFormat ===
        "PDF"
      ) {

        setNotification({
          type:
            "success",

          message:
            "PDF Complaint Processed",

          submessage:
            "Successfully extracted written complainant details, timeline, and incident notes.",
        });

      } else if (
        lastFileFormat ===
        "Audio"
      ) {

        setNotification({
          type:
            "success",

          message:
            "Voice Complaint Transcribed",

          submessage:
            "Speech-to-text completed and mapped to the complaint form.",
        });

      } else if (
        lastFileFormat ===
        "Image"
      ) {

        setNotification({
          type:
            "success",

          message:
            "Visual Evidence Analyzed",

          submessage:
            "Analyzed visual evidence and extracted complainant/incident details.",
        });

      } else {

        setNotification({
          type:
            "success",

          message:
            "Evidence Successfully Merged",

          submessage:
            "The extracted information was consolidated into the complaint form.",
        });
      }


      setStep(2);

    } catch (
      error: any
    ) {

      console.error(
        "Evidence extraction error:",
        error
      );


      setNotification({
        type:
          "error",

        message:
          "Extraction Failed",

        submessage:
          getErrorMessage(
            error,
            "Could not extract evidence. Please check the backend."
          ),
      });

    } finally {

      setLoadingExtraction(
        false
      );
    }
  }


  // ==========================================================
  // FILE CHANGES
  // ==========================================================

  function handleFilesChange(
    newFiles: UploadedFile[]
  ) {

    /*
     * If evidence is removed, reset Master AI because
     * the existing master no longer represents the current
     * evidence set.
     */

    if (
      newFiles.length <
      uploadedFiles.length
    ) {

      setMasterAiJson(
        null
      );


      setNotification({
        type:
          "error",

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


    setUploadedFiles(
      []
    );


    setMasterAiJson(
      null
    );


    setNotification(
      null
    );


    setRegisteredComplaintNumber(
      null
    );


    setForm(
      initialForm
    );


    setStep(1);


    setSubmitted(
      false
    );


    setIsSubmitting(
      false
    );


    isSubmittingRef.current =
      false;
  }


  // ==========================================================
  // SAVE ONE EVIDENCE
  // ==========================================================

  async function saveEvidence(
    complaintId: string,
    item: UploadedFile
  ) {

    const formData =
      new FormData();


    // --------------------------------------------------------
    // Complaint ID
    // --------------------------------------------------------

    formData.append(
      "complaint_id",
      complaintId
    );


    // --------------------------------------------------------
    // Evidence type
    // --------------------------------------------------------

    formData.append(
      "evidence_type",
      item.type ||
        item.file.type ||
        "Unknown"
    );


    // --------------------------------------------------------
    // Extraction JSON
    // --------------------------------------------------------

    formData.append(
      "extraction_data",
      JSON.stringify(
        item.extraction ||
          {}
      )
    );


    // --------------------------------------------------------
    // Extracted text
    // --------------------------------------------------------

    formData.append(
      "extracted_text",
      getExtractedText(
        item.extraction
      )
    );


    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------

    formData.append(
      "summary",
      getEvidenceSummary(
        item.extraction
      )
    );


    // --------------------------------------------------------
    // Actual file
    // --------------------------------------------------------

    formData.append(
      "file",
      item.file,
      item.file.name
    );


    /*
     * IMPORTANT:
     *
     * Do NOT manually set:
     *
     * Content-Type: multipart/form-data
     *
     * Axios/browser generates the multipart boundary.
     */

    const response =
      await axios.post(
        `${API_BASE}/api/evidences/`,
        formData
      );


    return response.data;
  }


  // ==========================================================
  // SAVE ALL EVIDENCE
  // ==========================================================

  async function saveAllEvidence(
    complaintId: string
  ) {

    if (
      uploadedFiles.length ===
      0
    ) {

      return;
    }


    console.log(
      `Saving ${uploadedFiles.length} evidence file(s)...`
    );


    for (
      const item of uploadedFiles
    ) {

      await saveEvidence(
        complaintId,
        item
      );
    }


    console.log(
      "All evidence saved successfully."
    );
  }


  // ==========================================================
  // UPLOAD PERSON PHOTO
  // ==========================================================

  async function uploadPersonPhoto(
    complaintId: string,
    personType:
      | "victim"
      | "suspect",
    file: File
  ): Promise<string> {

    const formData =
      new FormData();


    formData.append(
      "complaint_id",
      complaintId
    );


    formData.append(
      "person_type",
      personType
    );


    formData.append(
      "file",
      file,
      file.name
    );


    /*
     * IMPORTANT:
     *
     * Again, don't manually set Content-Type.
     */

    const response =
      await axios.post(
        `${API_BASE}/api/person-photos/upload`,
        formData
      );


    const url =
      response.data?.url;


    if (
      !url
    ) {

      throw new Error(
        `Cloudinary did not return a URL for the ${personType} photo.`
      );
    }


    return url;
  }


  // ==========================================================
  // UPLOAD PERSON PHOTO IF NEEDED
  // ==========================================================

  async function getPersonPhotoUrl(
    complaintId: string,
    person: PersonEntry,
    personType:
      | "victim"
      | "suspect"
  ): Promise<
    string | undefined
  > {

    /*
     * No new photo selected.
     *
     * If there is already a Cloudinary URL,
     * keep it.
     */

    if (
      !person.photoFile
    ) {

      return person.photoUrl;
    }


    const url =
      await uploadPersonPhoto(
        complaintId,
        personType,
        person.photoFile
      );


    return url;
  }


  // ==========================================================
  // SUBMIT COMPLAINT
  // ==========================================================

  async function handleSubmit() {

    // ========================================================
    // IMMEDIATE DUPLICATE-SUBMISSION LOCK
    // ========================================================

    if (
      isSubmittingRef.current
    ) {

      console.log(
        "Submission already in progress. Ignoring duplicate click."
      );

      return;
    }


    /*
     * Set the ref BEFORE doing anything asynchronous.
     */

    isSubmittingRef.current =
      true;


    setIsSubmitting(
      true
    );


    setNotification({
      type:
        "success",

      message:
        "Submitting Complaint...",

      submessage:
        "Please wait while the complaint, evidence, photos, and people details are being saved.",
    });


    try {

      // ======================================================
      // 1. VALIDATION
      // ======================================================

      if (
        !form.complaintType
      ) {

        throw new Error(
          "Please select a complaint type."
        );
      }


      if (
        !form.crimeCategory
      ) {

        throw new Error(
          "Please select a crime category."
        );
      }


      if (
        !form.crimeSubcategory
      ) {

        throw new Error(
          "Please select a crime subcategory."
        );
      }


      if (
        !form.description.trim()
      ) {

        throw new Error(
          "Please enter the incident description."
        );
      }


      // ======================================================
      // 2. CREATE COMPLAINT
      // ======================================================

      const complaintPayload =
        {

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
        complaintResponse
          .data
          ?.complaint_id;


      const complaintNumber =
        complaintResponse
          .data
          ?.complaint_number;


      if (
        !complaintId
      ) {

        throw new Error(
          "Complaint was created but complaint_id was not returned by the backend."
        );
      }


      console.log(
        "Complaint ID:",
        complaintId
      );


      // ======================================================
      // 4. SAVE EVIDENCE
      // ======================================================

      await saveAllEvidence(
        complaintId
      );


      // ======================================================
      // 5. SAVE VICTIMS
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

        /*
         * Upload photo first if one exists.
         */

        const photoUrl =
          await getPersonPhotoUrl(
            complaintId,
            victim,
            "victim"
          );


        await createVictim(
          complaintId,
          {
            ...victim,

            photoUrl:photoUrl
          }
        );
      }


      console.log(
        `Saved ${validVictims.length} victim(s)`
      );


      // ======================================================
      // 6. SAVE SUSPECTS
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

        /*
         * Upload photo first if one exists.
         */

        const photoUrl =
          await getPersonPhotoUrl(
            complaintId,
            suspect,
            "suspect"
          );


        await createSuspect(
          complaintId,
          {
            ...suspect,

            photoUrl:photoUrl 
          }
        );
      }


      console.log(
        `Saved ${validSuspects.length} suspect(s)`
      );


      // ======================================================
      // 7. SAVE COMPLAINANTS
      // ======================================================

      const validComplainants =
        form.complainants.filter(
          (complainant) =>
            complainant.name &&
            complainant.name.trim()
        );


      for (
        const complainant of
          validComplainants
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
      // 8. STORE COMPLAINT NUMBER
      // ======================================================

      setRegisteredComplaintNumber(
        complaintNumber
      );


      // ======================================================
      // 9. SUCCESS
      // ======================================================

      setNotification({
        type:
          "success",

        message:
          "Complaint Registered Successfully",

        submessage:
          `Complaint Number: ${complaintNumber}${
            uploadedFiles.length > 0
              ? ` • ${uploadedFiles.length} evidence file(s) saved`
              : ""
          }`,
      });


      setSubmitted(
        true
      );

    } catch (
      error: any
    ) {

      console.error(
        "Complaint submission failed:",
        error
      );


      const message =
        getErrorMessage(
          error,
          "Could not save the complaint."
        );


      setNotification({
        type:
          "error",

        message:
          "Submission Failed",

        submessage:
          message,
      });

    } finally {

      /*
       * Allow another attempt after the request finishes.
       */

      setIsSubmitting(
        false
      );


      isSubmittingRef.current =
        false;
    }
  }


  // ==========================================================
  // SUCCESS SCREEN
  // ==========================================================

  if (
    submitted
  ) {

    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-lg border border-gold-200 bg-white p-10 text-center shadow-md">

        <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">

          <CheckCircle2
            className="h-10 w-10"
          />

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

              {
                registeredComplaintNumber
              }

            </p>

          </div>

        )}


        <p className="mt-4 max-w-xl text-base text-ink-600">

          The complaint, evidence, photos, and related details have been saved successfully to the CrimeOS registry.

        </p>


        <button
          type="button"

          onClick={() => {

            setSubmitted(
              false
            );

            setRegisteredComplaintNumber(
              null
            );

            setStep(1);

            setForm(
              initialForm
            );

            setUploadedFiles(
              []
            );

            setMasterAiJson(
              null
            );

            setNotification(
              null
            );

            setIsSubmitting(
              false
            );

            isSubmittingRef.current =
              false;
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

          {uploadedFiles.length >
            0 && (

            <button
              type="button"

              onClick={
                resetAllData
              }

              disabled={
                isSubmitting ||
                loadingExtraction
              }

              className="flex items-center gap-1.5 rounded-md border border-gold-300 bg-ivory px-4 py-2 text-sm text-ink-900 transition-colors hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RotateCcw
                className="h-4 w-4 text-ink-600"
              />

              Reset Form

            </button>

          )}


          <button
            type="button"

            onClick={() => {

              setNotification(
                null
              );

              setStep(2);
            }}

            disabled={
              isSubmitting ||
              loadingExtraction
            }

            className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        <Stepper
          currentStep={
            step
          }
        />

      </div>


      {/* ==================================================== */}
      {/* NOTIFICATION */}
      {/* ==================================================== */}

      {notification && (

        <div
          className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
            notification.type ===
            "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >

          {notification.type ===
          "success" ? (

            <CheckCircle2
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"
            />

          ) : (

            <AlertCircle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
            />

          )}


          <div>

            <p className="font-semibold text-ink-900">

              {
                notification.message
              }

            </p>


            {notification.submessage && (

              <p className="mt-0.5 whitespace-pre-line text-xs opacity-90">

                {
                  notification.submessage
                }

              </p>

            )}

          </div>

        </div>

      )}


      {/* ==================================================== */}
      {/* SUBMISSION LOADING */}
      {/* ==================================================== */}

      {isSubmitting && (

        <div className="mt-6 overflow-hidden rounded-lg border border-gold-200 bg-ivory">

          <div className="flex items-center gap-3 px-4 py-3">

            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold-300 border-t-maroon-600" />


            <div>

              <p className="text-sm font-semibold text-ink-900">

                Submitting complaint...

              </p>


              <p className="text-xs text-ink-600">

                Please do not click Submit again.

              </p>

            </div>

          </div>


          <div className="h-1 w-full overflow-hidden bg-gold-100">

            <div className="h-full w-1/3 animate-pulse bg-maroon-600" />

          </div>

        </div>

      )}


      {/* ==================================================== */}
      {/* CURRENT STEP */}
      {/* ==================================================== */}

      <div className="mt-8">

        {/* STEP 1 */}

        {step === 1 && (

          <DocumentsAndEvidence
            files={
              uploadedFiles
            }

            onFilesChange={
              handleFilesChange
            }

            onExtractClick={
              handleExtractClick
            }

            loading={
              loadingExtraction
            }
          />

        )}


        {/* STEP 2 */}

        {step === 2 && (

          <ComplaintDetails
            form={
              form
            }

            setForm={
              setForm
            }
          />

        )}


        {/* STEP 3 */}

        {step === 3 && (

          <VictimDetails
            victims={
              form.victims
            }

            setVictims={
              (victims) =>
                setForm(
                  (prev) => ({
                    ...prev,

                    victims:
                      victims,
                  })
                )
            }
          />

        )}


        {/* STEP 4 */}

        {step === 4 && (

          <SuspectDetails
            suspects={
              form.suspects
            }

            setSuspects={
              (suspects) =>
                setForm(
                  (prev) => ({
                    ...prev,

                    suspects:
                      suspects,
                  })
                )
            }
          />

        )}


        {/* STEP 5 */}

        {step === 5 && (

          <ComplainantDetails
            complainants={
              form.complainants
            }

            setComplainants={
              (complainants) =>
                setForm(
                  (prev) => ({
                    ...prev,

                    complainants:
                      complainants,
                  })
                )
            }
          />

        )}


        {/* STEP 6 */}

        {step === 6 && (

          <ReviewSubmission
            form={
              form
            }
          />

        )}

      </div>


      {/* ==================================================== */}
      {/* NAVIGATION */}
      {/* ==================================================== */}

      <NavigationButtons

        currentStep={
          step
        }

        totalSteps={
          totalSteps
        }


        onBack={() => {

          if (
            step > 1 &&
            !isSubmitting
          ) {

            setNotification(
              null
            );

            setStep(
              step - 1
            );
          }

        }}


        onNext={() => {

          if (
            step <
              totalSteps &&
            !isSubmitting
          ) {

            setNotification(
              null
            );

            setStep(
              step + 1
            );
          }

        }}


        onSubmit={
          handleSubmit
        }


        isSubmitting={
          isSubmitting
        }

      />

    </div>
  );
}