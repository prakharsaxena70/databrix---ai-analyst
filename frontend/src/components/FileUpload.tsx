"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, FileText, Sparkles } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export default function FileUpload({
  onFileSelect,
  isUploading,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8
        ${
          isDragActive
            ? "border-indigo-400 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 scale-[1.01] shadow-lg shadow-indigo-100/50"
            : "border-slate-200 bg-white/60 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50/30 hover:to-violet-50/30 hover:shadow-md"
        }
        ${isUploading ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`
          relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300
          ${
            isDragActive
              ? "bg-indigo-100 text-indigo-600 scale-110"
              : "bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-500"
          }
        `}
        >
          {isUploading ? (
            <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">
            {isUploading
              ? "Uploading & parsing..."
              : isDragActive
              ? "Drop your file here"
              : "Drop a file or click to upload"}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Supports CSV, XLSX, and PDF files up to 10MB
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100/50">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100/50">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            XLSX
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100/50">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </div>
        </div>

        {isUploading && (
          <div className="w-48 h-1.5 mt-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        )}
      </div>
    </div>
  );
}
