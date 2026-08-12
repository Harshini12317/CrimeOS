export interface UploadedFile {
  id: number;
  file: File;
  type: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

export interface AttachmentMeta {
  id: string;
  fileName: string;
  fileType: string;
  documentUrl?: string;
  extractedText?: string;
  summary?: string;
  extraction?: any; // Simplified for brevity, your existing nested type is fine here too
}

export interface PersonEntry {
  name: string;
  contact: string;
  relationship?: string;
  statement?: string;
  type?: string;
  description?: string;
  status?: string;
  address?: string; // NEW: Added to match database!
  photoUrl?: string;
  photoName?: string;
}

export interface ComplaintData {
  complaintType: string;
  crimeCategory: string;
  crimeSubcategory: string;
  priority: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  description: string;
  aiSummary: string;
  officerNotes: string;
  complainants: PersonEntry[];
  victims: PersonEntry[];
  suspects: PersonEntry[];
  attachments: AttachmentMeta[];
}