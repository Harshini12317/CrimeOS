// "use client";

// import { useState } from "react";
// import { FileText, Paperclip, CheckCircle2 } from "lucide-react";
// import FileUploader from "../upload/FileUploader";
// import { UploadedFile } from "../types";

// interface Props {
//   onDocumentsSubmit?: (uploadedFiles: UploadedFile[]) => void;
// }

// export default function DocumentsAndEvidence({ onDocumentsSubmit }: Props) {
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

//   return (
//     <div className="space-y-6 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
//       <div>
//         <p className="text-base font-medium text-gold-700">Step 1</p>
//         <h2 className="mt-1 text-2xl font-semibold text-ink-900">Documents and evidence</h2>
//         <p className="mt-2 text-base text-ink-600">
//           Upload supporting documents, photos, audio, or videos and capture them as evidence for this complaint.
//         </p>
//       </div>

//       <FileUploader
//         onFilesChange={(files) => setUploadedFiles(files)}
//         onExtractComplete={(files) => {
//           setUploadedFiles(files);
//           onDocumentsSubmit?.(files);
//         }}
//       />

//       {uploadedFiles.length > 0 ? (
//         <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
//           <div className="flex items-center gap-2 text-emerald-700">
//             <CheckCircle2 className="h-5 w-5" />
//             <p className="font-semibold">Evidence prepared for submission</p>
//           </div>
//           <div className="mt-3 space-y-2">
//             {uploadedFiles.map((item) => (
//               <div key={item.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3">
//                 <div className="flex items-center gap-3">
//                   <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
//                     <FileText className="h-4 w-4" />
//                   </div>
//                   <div>
//                     <p className="font-semibold text-ink-900">{item.file.name}</p>
//                     <p className="text-sm text-ink-600">{item.type || "Unknown file type"}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2 rounded-full bg-ivory px-3 py-1 text-sm text-ink-600">
//                   <Paperclip className="h-4 w-4" />
//                   Attached
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }

"use client";

import { FileText, Paperclip, CheckCircle2 } from "lucide-react";
import FileUploader from "../upload/FileUploader";
import { UploadedFile } from "../types";

interface Props {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onExtractClick: () => void;
  loading: boolean;
}

export default function DocumentsAndEvidence({ files, onFilesChange, onExtractClick, loading }: Props) {
  return (
    <div className="space-y-6 rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-base font-medium text-gold-700">Step 1</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink-900">Documents and evidence</h2>
        <p className="mt-2 text-base text-ink-600">
          Upload supporting documents and capture them as evidence for this complaint.
        </p>
      </div>

      {/* Pass everything straight to the Uploader */}
      <FileUploader
        files={files}
        onFilesChange={onFilesChange}
        onExtractClick={onExtractClick}
        loading={loading}
      />

      {files.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-semibold">Evidence prepared for submission</p>
          </div>
          <div className="mt-3 space-y-2">
            {files.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink-900">{item.file.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-ivory px-3 py-1 text-sm text-ink-600">
                  <Paperclip className="h-4 w-4" /> Attached
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}