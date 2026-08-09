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

  extraction?: {
    sections?: {
      narrative_text?: string;

      incident_details?: {
        description?: string;
      };

      complainant_details?: {
        name?: string;
      };

      accused_details?: Array<{
        name?: string;
      }>;
    };

    entities?: {
      locations?: string[];
      phone_numbers?: string[];
      people?: Array<{
        name?: string;
      }>;
    };

    key_facts?: string[];
    full_text?: string;
  };
}

export interface PersonEntry {
  name: string;
  contact: string;

  relationship?: string;
  statement?: string;

  type?: string;
  description?: string;
  status?: string;

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