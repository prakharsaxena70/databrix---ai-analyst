"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserSessions, deleteSession, uploadFile } from "@/lib/api";
import { SessionData } from "@/lib/types";
import {
  Database,
  FileSpreadsheet,
  FileText,
  Table,
  Trash2,
  Upload,
  Search,
  Loader2,
  ArrowUpRight,
  HardDrive,
  Clock,
  Rows3,
  Columns3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recently";
  }
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv") return <FileText className="h-5 w-5 text-green-400" />;
  if (ext === "xlsx") return <Table className="h-5 w-5 text-blue-400" />;
  if (ext === "pdf") return <FileText className="h-5 w-5 text-red-400" />;
  return <FileSpreadsheet className="h-5 w-5 text-indigo-400" />;
}

function getFileBadgeColor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "bg-green-500/10 text-green-400 border-green-500/20";
  if (ext === "xlsx") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (ext === "pdf") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
}

export default function DataSourcesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setIsLoading(true);
      const data = await getUserSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this data source?")) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      const response = await uploadFile(file);
      router.push(`/app/chat/${response.session_id}`);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  const filtered = sessions.filter((s) =>
    s.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = sessions.reduce(
    (sum, s) => sum + (s.file_meta?.size || 0),
    0
  );

  return (
    <div className="h-full flex flex-col bg-[#0f1117] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 py-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-black text-white tracking-tight">
                Data Sources
              </h1>
              <p className="text-[13px] text-slate-500 font-medium">
                Manage your uploaded datasets and files
              </p>
            </div>
          </div>
          <label>
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <Button className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 font-bold text-sm cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload New
            </Button>
          </label>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <HardDrive className="h-4 w-4 text-indigo-400" />
            <span className="text-[12px] font-bold text-slate-400">
              {sessions.length} datasets
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="text-[12px] font-bold text-slate-400">
              {formatFileSize(totalSize)} total
            </span>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 transition-colors w-64"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <Database className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-[18px] font-bold text-white mb-2">
              {searchQuery ? "No matching datasets" : "No data sources yet"}
            </h3>
            <p className="text-[13px] text-slate-500 font-medium mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Upload a CSV, Excel, or PDF file to get started"}
            </p>
            {!searchQuery && (
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </label>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const ext = s.filename.split(".").pop()?.toUpperCase() || "FILE";
              const rows = s.file_meta?.shape?.rows || 0;
              const cols = s.file_meta?.shape?.columns || 0;

              return (
                <div
                  key={s.id}
                  className="group bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-indigo-500/20 transition-all cursor-pointer relative"
                  onClick={() => router.push(`/app/chat/${s.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        {getFileIcon(s.filename)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-white truncate max-w-[180px]">
                          {s.nickname || s.filename.replace(/\.[^/.]+$/, "")}
                        </p>
                        <Badge
                          className={cn(
                            "mt-1 text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0",
                            getFileBadgeColor(s.filename)
                          )}
                        >
                          {ext}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/chat/${s.id}`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-3">
                    {rows > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Rows3 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold">
                          {rows.toLocaleString()} rows
                        </span>
                      </div>
                    )}
                    {cols > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Columns3 className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold">
                          {cols} cols
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-medium">
                        {formatDate(s.created_at || "")}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-600">
                      {formatFileSize(s.file_meta?.size || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
