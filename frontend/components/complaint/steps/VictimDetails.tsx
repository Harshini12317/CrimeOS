"use client";

import { useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { PersonEntry } from "../types";


interface Props {
  victims: PersonEntry[];

  setVictims: (
    victims: PersonEntry[]
  ) => void;
}


export default function VictimDetails({
  victims,
  setVictims,
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
      victims.map(
        (entry, i) =>
          i === index
            ? {
                ...entry,
                [field]: value,
              }
            : entry
      );

    setVictims(updated);
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


    // Only allow images
    if (
      !file.type.startsWith("image/")
    ) {

      alert(
        "Please select an image file."
      );

      return;
    }


    // 5 MB limit
    if (
      file.size > 5 * 1024 * 1024
    ) {

      alert(
        "Photo must be smaller than 5 MB."
      );

      return;
    }


    const updated =
      victims.map(
        (entry, i) =>
          i === index
            ? {
                ...entry,

                photoFile:
                  file,

                photoName:
                  file.name,

                /*
                 * photoUrl is intentionally not
                 * set here.
                 *
                 * It will be set after Cloudinary
                 * upload during complaint submission.
                 */
              }
            : entry
      );


    setVictims(updated);
  }


  // ==========================================================
  // REMOVE PHOTO
  // ==========================================================

  function removePhoto(
    index: number
  ) {

    const updated =
      victims.map(
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


    setVictims(updated);


    if (
      fileInputRefs.current[index]
    ) {
      fileInputRefs.current[
        index
      ]!.value = "";
    }
  }


  // ==========================================================
  // REMOVE VICTIM
  // ==========================================================

  function removeVictim(
    index: number
  ) {

    setVictims(
      victims.filter(
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
  // ADD VICTIM
  // ==========================================================

  function addVictim() {

    setVictims([
      ...victims,

      {
        type:
          "Individual",

        name:
          "",

        contact:
          "",

        relationship:
          "",

        description:
          "",

        address:
          "",

        statement:
          "",
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
            Step 3
          </p>

          <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">
            Victim details
          </h2>

          <p className="mt-1 text-sm text-ink-600">
            Add one or more victims and include any protective notes.
          </p>

        </div>


        <button
          type="button"
          onClick={addVictim}
          className="rounded-md border border-maroon-600 bg-maroon-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-700"
        >
          Add victim
        </button>

      </div>


      {/* VICTIMS */}

      <div className="space-y-4">

        {victims.map(
          (victim, index) => (

            <div
              key={index}
              className="rounded-lg border border-gold-200 bg-ivory p-4 shadow-sm"
            >

              {/* CARD HEADER */}

              <div className="mb-4 flex items-center justify-between gap-4 border-b border-gold-200 pb-3">

                <p className="text-sm font-semibold text-ink-900">
                  Victim {index + 1}
                </p>


                {victims.length > 1 && (

                  <button
                    type="button"
                    onClick={() =>
                      removeVictim(index)
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

                    {victim.photoFile ? (

                      <img
                        src={URL.createObjectURL(
                          victim.photoFile
                        )}
                        alt="Victim"
                        className="h-full w-full object-cover"
                      />

                    ) : victim.photoUrl ? (

                      <img
                        src={victim.photoUrl}
                        alt="Victim"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <ImageIcon className="h-8 w-8 text-ink-400" />

                    )}

                  </div>


                  {/* PHOTO CONTROLS */}

                  <div className="flex-1">

                    <p className="text-sm font-semibold text-ink-900">
                      Victim photograph
                    </p>

                    <p className="mt-1 text-xs text-ink-600">
                      Upload a clear photograph of the victim.
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

                        {victim.photoFile ||
                        victim.photoUrl
                          ? "Change photo"
                          : "Add photo"}

                      </button>


                      {(victim.photoFile ||
                        victim.photoUrl) && (

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


                    {victim.photoName && (

                      <p className="mt-2 truncate text-xs text-ink-600">
                        Selected: {victim.photoName}
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
                    Victim type
                  </label>

                  <select
                    value={
                      victim.type ||
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
                      victim.name
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                    placeholder="Victim name"
                  />

                </div>


                {/* CONTACT */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Contact details
                  </label>

                  <input
                    value={
                      victim.contact
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


                {/* RELATIONSHIP */}

                <div>

                  <label className="mb-1 block text-sm font-medium text-ink-900">
                    Relationship to Suspect
                  </label>

                  <input
                    value={
                      victim.relationship ||
                      ""
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "relationship",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                    placeholder="e.g. Employee, Spouse, Stranger"
                  />

                </div>

              </div>


              {/* ADDRESS */}

              <div className="mt-4">

                <label className="mb-1 block text-sm font-medium text-ink-900">
                  Address
                </label>

                <input
                  value={
                    victim.address ||
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
                  placeholder="Victim address"
                />

              </div>


              {/* DESCRIPTION */}

              <div className="mt-4">

                <label className="mb-1 block text-sm font-medium text-ink-900">
                  Description / Injuries
                </label>

                <textarea
                  rows={2}
                  value={
                    victim.description ||
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
                  placeholder="Physical description or note of injuries"
                />

              </div>


              {/* STATEMENT */}

              <div className="mt-4">

                <label className="mb-1 block text-sm font-medium text-ink-900">
                  Statement / Account
                </label>

                <textarea
                  rows={3}
                  value={
                    victim.statement ||
                    ""
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "statement",
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  placeholder="Record victim account"
                />

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}