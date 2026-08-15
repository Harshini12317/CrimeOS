export interface UploadedFile {
  id: number;
  file: File;
  type: string;

  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;

  /*
   * AI extraction result for this individual file.
   * This is populated after Extract is clicked.
   */
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
  /*
   * Basic person information
   */
  name: string;

  contact: string;

  /*
   * Victim-specific / relationship information
   */
  relationship?: string;

  /*
   * Statement / account
   */
  statement?: string;

  /*
   * Individual / Organization / Unknown
   */
  type?: string;

  /*
   * Description / injuries / identifying remarks
   */
  description?: string;

  /*
   * Suspect status
   */
  status?: string;

  /*
   * Address / known location
   */
  address?: string;


  /*
   * =========================================================
   * PHOTO INFORMATION
   * =========================================================
   *
   * photoFile:
   * The actual image selected in the browser.
   *
   * photoName:
   * Original filename shown to the user.
   *
   * photoUrl:
   * Cloudinary URL returned after backend upload.
   *
   * IMPORTANT:
   * photoFile is never sent directly in the JSON
   * createVictim/createSuspect request.
   *
   * It is first uploaded to Cloudinary.
   * Then photoUrl is sent to the DB API.
   */

  photoFile?: File;

  photoName?: string;

  photoUrl?: string;
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


  /*
   * People associated with the complaint
   */

  complainants: PersonEntry[];

  victims: PersonEntry[];

  suspects: PersonEntry[];


  /*
   * Supporting documents/evidence metadata
   */

  attachments: AttachmentMeta[];
}