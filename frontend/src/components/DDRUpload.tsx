"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Loader2, FileImage } from "lucide-react";

interface DDRUploadProps {
  onReportGenerated?: (report: any) => void;
}

export default function DDRUpload({ onReportGenerated }: DDRUploadProps) {
  const [inspectionFile, setInspectionFile] = useState<File | null>(null);
  const [thermalFile, setThermalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDDR = async () => {
    if (!inspectionFile) {
      setError("Please upload an Inspection Report");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("inspection_report", inspectionFile);
      if (thermalFile) {
        formData.append("thermal_report", thermalFile);
      }

      const response = await fetch("/api/ddr/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate DDR");
      }

      const data = await response.json();
      
      if (onReportGenerated) {
        onReportGenerated(data.report);
      }
    } catch (err) {
      console.error("DDR generation failed:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* File Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inspection Report */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-500 transition-colors">
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <h3 className="font-medium text-slate-700 mb-1">Inspection Report</h3>
            <p className="text-xs text-slate-500 mb-3">Required - PDF format</p>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setInspectionFile(e.target.files?.[0] || null)}
              />
              <Button variant="outline" size="sm" type="button">
                <Upload className="h-4 w-4 mr-1" />
                {inspectionFile ? "Change File" : "Upload PDF"}
              </Button>
            </label>
            
            {inspectionFile && (
              <p className="mt-2 text-xs text-green-600 font-medium">
                {inspectionFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Thermal Report */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-500 transition-colors">
          <div className="text-center">
            <FileImage className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <h3 className="font-medium text-slate-700 mb-1">Thermal Report</h3>
            <p className="text-xs text-slate-500 mb-3">Optional - PDF format</p>
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setThermalFile(e.target.files?.[0] || null)}
              />
              <Button variant="outline" size="sm" type="button">
                <Upload className="h-4 w-4 mr-1" />
                {thermalFile ? "Change File" : "Upload PDF"}
              </Button>
            </label>
            
            {thermalFile && (
              <p className="mt-2 text-xs text-green-600 font-medium">
                {thermalFile.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateDDR}
        disabled={!inspectionFile || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating DDR Report...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Generate DDR Report
          </>
        )}
      </Button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <h4 className="font-medium mb-2">What happens next?</h4>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>AI extracts text and images from your PDFs</li>
          <li>Images are automatically assigned to specific areas</li>
          <li>Generates unique analysis for each area (no boilerplate)</li>
          <li>Identifies conflicts and missing information</li>
          <li>Creates structured report with area-specific details</li>
        </ul>
      </div>
    </div>
  );
}
