export interface UploadedFile {
  id: number;
  file: File;
  type: string;

  // Cloudinary information
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;

  // Extraction belonging specifically to THIS file
  extraction?: any;
}

export interface AttachmentMeta {
  id: string;
  fileName: string;
  fileType: string;
  documentUrl?: string;
  cloudinaryPublicId?: string;
  extractedText?: string;
  summary?: string;
  extraction?: any;
}

export interface PersonEntry {
  name: string;
  contact: string;
  relationship?: string;
  statement?: string;
  type?: string;
  description?: string;
  status?: string;
  address?: string;
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