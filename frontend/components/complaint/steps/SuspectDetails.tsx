"use client";

import { useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { PersonEntry } from "../types";


interface Props {
  suspects: PersonEntry[];

  setSuspects: (
    suspects: PersonEntry[]
  ) => void;
}


export default function SuspectDetails({
  suspects,
  setSuspects,
}: Props) {

  const fileInputRefs =
    useRef<Array<HTMLInputElement | null>>([]);


  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  function handleFieldChange(
    index: number,
    field: keyof PersonEntry,
    value: string
  ) {

    const updated =
      suspects.map(
        (entry, i) =>
          i === index
            ? {
                ...entry,
                [field]: value,
              }
            : entry
      );

    setSuspects(updated);
  }


  // ==========================================================
  // PHOTO CHANGE
  // ==========================================================

  function handlePhotoChange(
    index: number,
    file: File | undefined
  ) {

    if (!file) {
      return;
    }


    if (
      !file.type.startsWith("image/")
    ) {

      alert(
        "Please select an image file."
      );

      return;
    }


    if (
      file.size > 5 * 1024 * 1024
    ) {

      alert(
        "Photo must be smaller than 5 MB."
      );

      return;
    }


    const updated =
      suspects.map(
        (entry, i) =>
          i === index
            ? {
                ...entry,

                photoFile:
                  file,

                photoName:
                  file.name,
              }
            : entry
      );


    setSuspects(updated);
  }


  // ==========================================================
  // REMOVE PHOTO
  // ==========================================================

  function removePhoto(
    index: number
  ) {

    const updated =
      suspects.map(
        (entry, i) =>
          i === index
            ? {
                ...entry,

                photoFile:
                  undefined,

                photoName:
                  undefined,

                photoUrl:
                  undefined,
              }
            : entry
      );


    setSuspects(updated);


    if (
      fileInputRefs.current[index]
    ) {

      fileInputRefs.current[
        index
      ]!.value = "";
    }
  }


  // ==========================================================
  // REMOVE SUSPECT
  // ==========================================================

  function removeSuspect(
    index: number
  ) {

    setSuspects(
      suspects.filter(
        (_, i) =>
          i !== index
      )
    );


    fileInputRefs.current.splice(
      index,
      1
    );
  }


  // ==========================================================
  // ADD SUSPECT
  // ==========================================================

  function addSuspect() {

    setSuspects([
      ...suspects,

      {
        type:
          "Individual",

        name:
          "",

        contact:
          "",

        address:
          "",

        description:
          "",

        status:
          "Suspected",
      },
    ]);
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">

      {/* HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
            Step 4
          </p>

          <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">
            Suspect details
          </h2>

          <p className="mt-1 text-sm text-ink-600">
            Record one or more suspects, status, and identifying remarks.
          </p>

        </div>


        <button
          type="button"
          onClick={addSuspect}
          className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
        >
          Add suspect
        </button>

      </div>


      {/* SUSPECTS */}

      <div className="space-y-4">

        {suspects.map(
          (suspect, index) => (

            <div
              key={index}
              className="rounded-lg border border-gold-200 bg-ivory p-4 shadow-sm"
            >

              {/* CARD HEADER */}

              <div className="mb-4 flex items-center justify-between gap-4 border-b border-gold-200 pb-3">

                <p className="text-sm font-semibold text-ink-900">
                  Suspect {index + 1}
                </p>


                {suspects.length > 1 && (

                  <button
                    type="button"
                    onClick={() =>
                      removeSuspect(index)
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>

                )}

              </div>


              {/* PHOTO */}

              <div className="mb-5 rounded-lg border border-gold-200 bg-white p-4">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  {/* PREVIEW */}

                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-200 bg-ivory">

                    {suspect.photoFile ? (

                      <img
                        src={URL.createObjectURL(
                          suspect.photoFile
                        )}
                        alt="Suspect"
                        className="h-full w-full object-cover"
                      />

                    ) : suspect.photoUrl ? (

                      <img
                        src={suspect.photoUrl}
                        alt="Suspect"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <ImageIcon className="h-8 w-8 text-ink-400" />

                    )}

                  </div>


                  {/* CONTROLS */}

                  <div className="flex-1">

                    <p className="text-sm font-semibold text-ink-900">
                      Suspect photograph
                    </p>

                    <p className="mt-1 text-xs text-ink-600">
                      Upload a clear photograph of the suspect.
                      Maximum size: 5 MB.
                    </p>


                    <div className="mt-3 flex flex-wrap gap-2">

                      <input
                        ref={(element) => {
                          fileInputRefs.current[
                            index
                          ] = element;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handlePhotoChange(
                            index,
                            event.target.files?.[0]
                          )
                        }
                      />


                      <button
                        type="button"
                        onClick={() =>
                          fileInputRefs.current[
                            index
                          ]?.click()
                        }
                        className="flex items-center gap-2 rounded-md border border-maroon-600 bg-maroon-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
                      >

                        <Camera className="h-4 w-4" />

                        {suspect.photoFile ||
                        suspect.photoUrl
                          ? "Change photo"
                          : "Add photo"}

                      </button>


                      {(suspect.photoFile ||
                        suspect.photoUrl) && (

                        <button
                          type="button"
                          onClick={() =>
                            removePhoto(index)
                          }
                          className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >

                          <X className="h-4 w-4" />

                          Remove photo

                        </button>

                      )}

                    </div>


                    {suspect.photoName && (

                      <p className="mt-2 truncate text-xs text-ink-600">
                        Selected: {suspect.photoName}
                      </p>

                    )}

                  </div>

                </div>

              </div>


              {/* BASIC FIELDS */}

              <div className="grid gap-4 md:grid-cols-2">

                {/* TYPE */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Suspect type
                  </label>

                  <select
                    value={
                      suspect.type ||
                      ""
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "type",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  >

                    <option value="">
                      Select type
                    </option>

                    <option value="Individual">
                      Individual
                    </option>

                    <option value="Organization">
                      Organization
                    </option>

                    <option value="Unknown">
                      Unknown
                    </option>

                  </select>

                </div>


                {/* NAME */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Name
                  </label>

                  <input
                    value={
                      suspect.name
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                    placeholder="Suspect name"
                  />

                </div>


                {/* CONTACT */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Contact details
                  </label>

                  <input
                    value={
                      suspect.contact
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "contact",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                    placeholder="Phone or email"
                  />

                </div>


                {/* STATUS */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Status
                  </label>

                  <select
                    value={
                      suspect.status ||
                      ""
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "status",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  >

                    <option value="">
                      Select status
                    </option>

                    <option value="Suspected">
                      Suspected
                    </option>

                    <option value="Highly Suspected">
                      Highly Suspected
                    </option>

                    <option value="At large">
                      At large
                    </option>

                    <option value="Arrested">
                      Arrested
                    </option>

                  </select>

                </div>

              </div>


              {/* ADDRESS */}

              <div className="mt-4">

                <label className="mb-1 block text-sm font-medium text-ink-900">
                  Address / Location
                </label>

                <input
                  value={
                    suspect.address ||
                    ""
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "address",
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Known address or hangout spots"
                />

              </div>


              {/* DESCRIPTION */}

              <div className="mt-4">

                <label className="mb-1 block text-sm font-medium text-ink-900">
                  Description & Activity
                </label>

                <textarea
                  rows={3}
                  value={
                    suspect.description ||
                    ""
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "description",
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Add identifying remarks, clothing, or activity"
                />

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}