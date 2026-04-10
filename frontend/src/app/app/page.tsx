"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/api";
import { Loader2, FileSpreadsheet, Upload, FileText, Table, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const GET_STARTED_CARDS = [
  { title: "Sales Performance Analysis", desc: "Analyze revenue trends, identify top products, and forecast future sales" },
  { title: "Customer Segmentation", desc: "Cluster customers based on behavior and purchase patterns" },
  { title: "Market Trend Forecasting", desc: "Predict market trends using time-series analysis" },
  { title: "Financial Risk Assessment", desc: "Evaluate portfolio risk and detect anomalies" },
  { title: "Operational Efficiency", desc: "Optimize processes and identify bottlenecks" },
  { title: "Competitive Analysis", desc: "Compare performance metrics against competitors" }
];

export default function AppPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const handleCardClick = (prompt: string) => {
    setPendingPrompt(prompt);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (file: File) => {
    const allowedTypes = [".csv", ".xlsx", ".pdf"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      alert("Only CSV, XLSX, PDF allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadFile(file);
      if (pendingPrompt) {
        router.push(`/app/chat/${response.session_id}?q=${encodeURIComponent(pendingPrompt)}`);
      } else {
        router.push(`/app/chat/${response.session_id}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div 
      className="h-full flex flex-col items-center justify-center p-8 bg-[#0f1117]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Upload Backdrop */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1117]/80 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white animate-pulse shadow-2xl shadow-indigo-500/50">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-[24px] font-black text-white tracking-tight">DataBrix AI</h3>
              <p className="text-[14px] text-slate-400 font-medium">Processing your data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-4 z-[60] bg-[#1a1d24]/90 backdrop-blur-xl border-4 border-dashed border-indigo-500/50 rounded-3xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-500/50">
            <Upload className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Drop your data here</h2>
          <p className="text-sm text-slate-400 font-medium">CSV, Excel, or PDF files</p>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
            <span className="text-3xl font-black text-white">B</span>
          </div>
          <div>
            <h1 className="text-[32px] font-black text-white tracking-tight mb-2">
              What would you like to analyze?
            </h1>
            <p className="text-[16px] text-slate-400 font-medium">
              Upload your data or try one of the suggestions below
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="relative">
          <label className="flex flex-col items-center justify-center w-full h-48 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-all">
                <FileSpreadsheet className="h-8 w-8 text-indigo-400 group-hover:text-indigo-300" />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-white mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-[13px] text-slate-500">
                  CSV, Excel, or PDF files up to 10MB
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </label>
        </div>

        {/* Get Started Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Get Started</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GET_STARTED_CARDS.map((card, idx) => (
              <button
                key={idx}
                className="text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                onClick={() => handleCardClick(card.title)}
              >
                <h3 className="text-[14px] font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[12px] text-slate-500 group-hover:text-slate-400">
                  {card.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Supported Formats */}
        <div className="flex items-center justify-center gap-6 text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-green-400" />
            </div>
            <span className="text-[12px] font-medium">CSV</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Table className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-[12px] font-medium">Excel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-[12px] font-medium">PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
