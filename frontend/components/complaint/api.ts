import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";


// ==========================================================
// CREATE COMPLAINANT
// ==========================================================

export async function createComplainant(
  complaintId: string,
  complainant: {
    name: string;
    contact?: string;
    relationship?: string;
    statement?: string;
    type?: string;
    address?: string;
  }
) {
  const response = await axios.post(
    `${API_BASE}/api/complainants`,
    {
      complaint_id: complaintId,

      name: complainant.name,

      contact:
        complainant.contact || null,

      relationship:
        complainant.relationship || null,

      statement:
        complainant.statement || null,

      type:
        complainant.type || null,

      address:
        complainant.address || null,
    }
  );

  return response.data;
}


// ==========================================================
// CREATE VICTIM
// ==========================================================

export async function createVictim(
  complaintId: string,
  victim: {
    name: string;
    contact?: string;
    relationship?: string;
    statement?: string;
    type?: string;
    description?: string;
    address?: string;
    photoUrl?: string;
  }
) {
  const response = await axios.post(
    `${API_BASE}/api/victims`,
    {
      complaint_id: complaintId,

      name: victim.name,

      contact:
        victim.contact || null,

      relationship:
        victim.relationship || null,

      statement:
        victim.statement || null,

      type:
        victim.type || null,

      description:
        victim.description || null,

      address:
        victim.address || null,

      photo_url:
        victim.photoUrl || null,
    }
  );

  return response.data;
}


// ==========================================================
// CREATE SUSPECT
// ==========================================================

export async function createSuspect(
  complaintId: string,
  suspect: {
    name: string;
    contact?: string;
    description?: string;
    status?: string;
    type?: string;
    address?: string;
    photoUrl?: string;
  }
) {
  const response = await axios.post(
    `${API_BASE}/api/suspects`,
    {
      complaint_id: complaintId,

      name:
        suspect.name || null,

      contact:
        suspect.contact || null,

      description:
        suspect.description || null,

      status:
        suspect.status || null,

      type:
        suspect.type || null,

      address:
        suspect.address || null,

      photo_url:
        suspect.photoUrl || null,
    }
  );

  return response.data;
}