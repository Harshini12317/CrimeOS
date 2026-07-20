// "use client";

// import { useState, useCallback } from "react";
// import { useDropzone } from "react-dropzone";

// import {
//   UploadCloud,
//   FileText,
//   ImageIcon,
//   Music,
//   Video,
//   Trash2,
//   Sparkles,
//   CheckCircle2,
// } from "lucide-react";

// import { UploadedFile } from "../types";

// interface Props {
//   onFilesChange?: (files: UploadedFile[]) => void;
//   onExtractComplete?: (files: UploadedFile[]) => void;
// }

// export default function FileUploader({ onFilesChange, onExtractComplete }: Props) {
//   const [files, setFiles] = useState<UploadedFile[]>([]);
//   const [loading, setLoading] = useState(false);

//   const syncFiles = (nextFiles: UploadedFile[]) => {
//     setFiles(nextFiles);
//     onFilesChange?.(nextFiles);
//   };

//   const onDrop = useCallback((acceptedFiles: File[]) => {
//     const uploaded = acceptedFiles.map((file) => ({
//       id: Date.now() + Math.random(),
//       file,
//       type: file.type || "Unknown",
//       category: "Unknown",
//     }));

//     syncFiles([...files, ...uploaded]);
//   }, [files, onFilesChange]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     multiple: true,
//     accept: {
//       "application/pdf": [".pdf"],
//       "image/*": [],
//       "audio/*": [],
//       "video/*": [],
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//         [".docx"],
//       "application/msword": [".doc"],
//       "text/plain": [".txt"],
//     },
//   });

//   function removeFile(id: number) {
//     const nextFiles = files.filter((file) => file.id !== id);
//     syncFiles(nextFiles);
//   }

//   async function extractDocuments() {
//     if (files.length === 0) {
//       alert("Please upload at least one document.");
//       return;
//     }

//     setLoading(true);

//     await new Promise((resolve) => setTimeout(resolve, 1800));

//     setLoading(false);
//     onExtractComplete?.(files);
//     alert("AI extraction completed and the evidence has been added to the complaint.");
//   }

//   function getIcon(type: string) {
//     if (type.startsWith("image")) return <ImageIcon className="text-gold-700" />;
//     if (type.startsWith("audio")) return <Music className="text-green-600" />;
//     if (type.startsWith("video")) return <Video className="text-red-600" />;
//     return <FileText className="text-orange-500" />;
//   }

//   return (
//     <div className="space-y-8">
//       {/* Upload Card */}
//       <div
//         {...getRootProps()}
//         className={`border-2 border-dashed rounded-xl p-10 transition cursor-pointer
//         ${
//           isDragActive
//             ? "border-maroon-700 bg-gold-50"
//             : "border-gold-300 hover:border-blue-500 hover:bg-gray-50"
//         }`}
//       >
//         <input {...getInputProps()} />

//         <div className="flex flex-col items-center">
//           <UploadCloud size={60} className="text-gold-700" />

//           <h2 className="text-2xl font-semibold mt-4">
//             Upload Complaint Documents
//           </h2>

//           <p className="text-ink-600 mt-2 text-center">
//             Drag & Drop PDF, Images, Audio, Video or Documents
//           </p>

//           <button
//             type="button"
//             className="mt-6 bg-maroon-700 text-white px-6 py-2 rounded-lg"
//           >
//             Browse Files
//           </button>

//           <p className="text-sm text-ink-600 mt-3">
//             Supports PDF • JPG • PNG • MP3 • MP4 • DOCX
//           </p>
//         </div>
//       </div>

//       {/* Uploaded Files */}
//       {files.length > 0 && (
//         <div className="bg-white rounded-xl border shadow-sm">
//           <div className="border-b px-6 py-4">
//             <h3 className="font-semibold text-lg">
//               Uploaded Evidence ({files.length})
//             </h3>
//           </div>

//           <div className="divide-y">
//             {files.map((item) => (
//               <div
//                 key={item.id}
//                 className="flex justify-between items-center px-6 py-4"
//               >
//                 <div className="flex gap-4 items-center">
//                   {getIcon(item.file.type)}

//                   <div>
//                     <p className="font-medium">{item.file.name}</p>

//                     <p className="text-sm text-ink-600">
//                       {(item.file.size / 1024 / 1024).toFixed(2)} MB
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex gap-6 items-center">
//                   <span className="text-sm bg-gold-100 px-3 py-1 rounded-full">
//                     {item.type || item.category}
//                   </span>

//                   <button
//                     onClick={() => removeFile(item.id)}
//                     className="text-red-500 hover:text-red-700"
//                   >
//                     <Trash2 size={18} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* AI Card */}
//       <div className="rounded-xl border bg-gold-50 p-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-semibold text-lg">
//               AI Document Extraction
//             </h3>

//             <p className="text-ink-600 mt-2">
//               Extract complaint details and automatically classify uploaded
//               documents into evidence categories.
//             </p>

//             <div className="mt-4 space-y-2">
//               <div className="flex gap-2 items-center">
//                 <CheckCircle2 className="text-green-600" size={18} />
//                 OCR Text Extraction
//               </div>

//               <div className="flex gap-2 items-center">
//                 <CheckCircle2 className="text-green-600" size={18} />
//                 Speech-to-Text
//               </div>

//               <div className="flex gap-2 items-center">
//                 <CheckCircle2 className="text-green-600" size={18} />
//                 Entity Recognition
//               </div>

//               <div className="flex gap-2 items-center">
//                 <CheckCircle2 className="text-green-600" size={18} />
//                 Evidence Classification
//               </div>
//             </div>
//           </div>

//           <button
//             onClick={extractDocuments}
//             disabled={loading}
//             className="bg-gold-600 hover:bg-gold-700 text-white px-6 py-3 rounded-lg flex gap-2 items-center disabled:opacity-50"
//           >
//             <Sparkles size={20} />

//             {loading ? "Extracting..." : "Extract From Documents"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud, FileText, ImageIcon, Music, Video, Trash2, Sparkles, CheckCircle2,
} from "lucide-react";
import { UploadedFile } from "../types";

interface Props {
  files: UploadedFile[]; // Receive files from Wizard
  onFilesChange: (files: UploadedFile[]) => void; // Send updates to Wizard
  onExtractClick: () => void; // Tell Wizard to start extraction
  loading: boolean; // Receive loading state from Wizard
}

export default function FileUploader({ files, onFilesChange, onExtractClick, loading }: Props) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploaded = acceptedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      type: file.type || "Unknown",
      category: "Unknown",
    }));
    onFilesChange([...files, ...uploaded]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "application/pdf": [".pdf"], "image/*": [], "audio/*": [] },
  });

  function removeFile(id: number) {
    onFilesChange(files.filter((file) => file.id !== id));
  }

  function getIcon(type: string) {
    if (type.startsWith("image")) return <ImageIcon className="text-gold-700" />;
    if (type.startsWith("audio")) return <Music className="text-green-600" />;
    if (type.startsWith("video")) return <Video className="text-red-600" />;
    return <FileText className="text-orange-500" />;
  }

  return (
    <div className="space-y-8">
      {/* Upload Card */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 transition cursor-pointer
        ${isDragActive ? "border-maroon-700 bg-gold-50" : "border-gold-300 hover:border-blue-500 hover:bg-gray-50"}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <UploadCloud size={60} className="text-gold-700" />
          <h2 className="text-2xl font-semibold mt-4">Upload Complaint Documents</h2>
          <p className="text-ink-600 mt-2 text-center">Drag & Drop PDF, Images, or Audio</p>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-lg">Uploaded Evidence ({files.length})</h3>
          </div>
          <div className="divide-y">
            {files.map((item) => (
              <div key={item.id} className="flex justify-between items-center px-6 py-4">
                <div className="flex gap-4 items-center">
                  {getIcon(item.file.type)}
                  <div>
                    <p className="font-medium">{item.file.name}</p>
                    <p className="text-sm text-ink-600">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => removeFile(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Card */}
      <div className="rounded-xl border bg-gold-50 p-6 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">AI Document Extraction</h3>
          <p className="text-ink-600 mt-2">Extract details & automatically merge multiple evidence files.</p>
        </div>
        <button
          onClick={onExtractClick}
          disabled={loading || files.length === 0}
          className="bg-gold-600 hover:bg-gold-700 text-white px-6 py-3 rounded-lg flex gap-2 items-center disabled:opacity-50"
        >
          <Sparkles size={20} />
          {loading ? "Extracting & Merging..." : "Extract From Documents"}
        </button>
      </div>
    </div>
  );
}