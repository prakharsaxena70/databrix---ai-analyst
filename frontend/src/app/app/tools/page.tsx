"use client";

import { useState, useRef } from "react";
import {
  Wrench,
  Trash2,
  FileSpreadsheet,
  FileText,
  Table,
  Image as ImageIcon,
  Code2,
  Merge,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCode2,
  FileImage,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  convertExcelToCSV,
  convertPDFToCSV,
  convertPDFToExcel,
  convertImageToExcel,
  convertImageToCSV,
  convertHTMLToCSV,
  mergeExcelFiles,
  mergeCSVFiles,
  generateSQL,
  jsonToExcel,
  removeDuplicates,
  smartClean,
} from "@/lib/api";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  category: string;
  acceptTypes: string;
  multiFile?: boolean;
  needsText?: boolean;
}

const TOOLS: Tool[] = [
  {
    id: "excel-to-csv",
    name: "Excel → CSV",
    description: "Convert Excel spreadsheets to CSV format",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    color: "text-green-400",
    borderColor: "border-green-500/20",
    bgColor: "bg-green-500/10",
    category: "Convert",
    acceptTypes: ".xlsx",
  },
  {
    id: "pdf-to-csv",
    name: "PDF → CSV",
    description: "Extract text data from PDFs into CSV",
    icon: <FileText className="h-5 w-5" />,
    color: "text-red-400",
    borderColor: "border-red-500/20",
    bgColor: "bg-red-500/10",
    category: "Convert",
    acceptTypes: ".pdf",
  },
  {
    id: "pdf-to-excel",
    name: "PDF → Excel",
    description: "Extract PDF content into Excel spreadsheet",
    icon: <FileText className="h-5 w-5" />,
    color: "text-orange-400",
    borderColor: "border-orange-500/20",
    bgColor: "bg-orange-500/10",
    category: "Convert",
    acceptTypes: ".pdf",
  },
  {
    id: "image-to-excel",
    name: "Image → Excel",
    description: "Extract tables from images using AI",
    icon: <FileImage className="h-5 w-5" />,
    color: "text-violet-400",
    borderColor: "border-violet-500/20",
    bgColor: "bg-violet-500/10",
    category: "AI Extract",
    acceptTypes: ".png,.jpg,.jpeg,.webp",
  },
  {
    id: "image-to-csv",
    name: "Image → CSV",
    description: "Extract table data from images to CSV",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "text-pink-400",
    borderColor: "border-pink-500/20",
    bgColor: "bg-pink-500/10",
    category: "AI Extract",
    acceptTypes: ".png,.jpg,.jpeg,.webp",
  },
  {
    id: "html-to-csv",
    name: "HTML → CSV",
    description: "Convert HTML tables to CSV format",
    icon: <Globe className="h-5 w-5" />,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bgColor: "bg-cyan-500/10",
    category: "Convert",
    acceptTypes: "",
    needsText: true,
  },
  {
    id: "merge-excel",
    name: "Merge Excel",
    description: "Combine multiple Excel files into one",
    icon: <Merge className="h-5 w-5" />,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/10",
    category: "Merge",
    acceptTypes: ".xlsx",
    multiFile: true,
  },
  {
    id: "merge-csv",
    name: "Merge CSV",
    description: "Combine multiple CSV files into one",
    icon: <Merge className="h-5 w-5" />,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
    category: "Merge",
    acceptTypes: ".csv",
    multiFile: true,
  },
  {
    id: "generate-sql",
    name: "Generate SQL",
    description: "Generate CREATE TABLE and INSERT statements",
    icon: <FileCode2 className="h-5 w-5" />,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/10",
    category: "Generate",
    acceptTypes: ".csv,.xlsx",
  },
  {
    id: "json-to-excel",
    name: "JSON → Excel",
    description: "Convert JSON data to editable Excel spreadsheet",
    icon: <Code2 className="h-5 w-5" />,
    color: "text-teal-400",
    borderColor: "border-teal-500/20",
    bgColor: "bg-teal-500/10",
    category: "Convert",
    acceptTypes: ".json",
  },
  {
    id: "remove-duplicates",
    name: "Remove Duplicates",
    description: "Detect and remove duplicate rows from your data",
    icon: <Trash2 className="h-5 w-5" />,
    color: "text-rose-400",
    borderColor: "border-rose-500/20",
    bgColor: "bg-rose-500/10",
    category: "Data Processing",
    acceptTypes: ".csv,.xlsx,.xls",
  },
  {
    id: "smart-clean",
    name: "Smart Data Cleaning",
    description: "AI-powered cleaning: fix formatting, fill missing values, standardize",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-indigo-400",
    borderColor: "border-indigo-500/20",
    bgColor: "bg-indigo-500/10",
    category: "Data Processing",
    acceptTypes: ".csv,.xlsx,.xls",
  },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [htmlInput, setHtmlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleToolAction(tool: Tool, files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    try {
      let blob: Blob;
      const file = files[0];
      const fileArr = Array.from(files);

      switch (tool.id) {
        case "excel-to-csv":
          blob = await convertExcelToCSV(file);
          break;
        case "pdf-to-csv":
          blob = await convertPDFToCSV(file);
          break;
        case "pdf-to-excel":
          blob = await convertPDFToExcel(file);
          break;
        case "image-to-excel":
          blob = await convertImageToExcel(file);
          break;
        case "image-to-csv":
          blob = await convertImageToCSV(file);
          break;
        case "merge-excel":
          blob = await mergeExcelFiles(fileArr);
          break;
        case "merge-csv":
          blob = await mergeCSVFiles(fileArr);
          break;
        case "generate-sql":
          blob = await generateSQL(file);
          break;
        case "json-to-excel":
          blob = await jsonToExcel(file);
          break;
        case "remove-duplicates":
          blob = await removeDuplicates(file);
          break;
        case "smart-clean":
          blob = await smartClean(file);
          break;
        default:
          throw new Error("Unknown tool");
      }

      // Download the result
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = tool.id.includes("excel") || tool.id.includes("xlsx")
        ? ".xlsx"
        : tool.id.includes("csv")
        ? ".csv"
        : tool.id.includes("sql")
        ? ".sql"
        : ".txt";
      a.download = `databrix_${tool.id.replace(/-/g, "_")}_result${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResult({ success: true, message: `File converted and downloaded successfully!` });
    } catch (err) {
      console.error("Tool failed:", err);
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Conversion failed",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleHTMLConvert() {
    if (!htmlInput.trim()) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const blob = await convertHTMLToCSV(htmlInput);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "databrix_html_to_csv_result.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setResult({ success: true, message: "HTML table converted and downloaded!" });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Conversion failed",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const categories = [...new Set(TOOLS.map((t) => t.category))];

  return (
    <div className="h-full flex flex-col bg-[#0f1117] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-white tracking-tight">
              Data Tools
            </h1>
            <p className="text-[13px] text-slate-500 font-medium">
              Convert, merge, and transform your data files
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Result Banner */}
        {result && (
          <div
            className={cn(
              "mb-6 px-5 py-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
              result.success
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <Wrench className="h-5 w-5 shrink-0" />
            )}
            <span className="text-[13px] font-bold">{result.message}</span>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-[11px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tool Categories */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {category}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {TOOLS.filter((t) => t.category === category).map((tool) => (
                <div
                  key={tool.id}
                  className={cn(
                    "group bg-white/5 border rounded-2xl p-5 hover:bg-white/[0.07] transition-all relative overflow-hidden",
                    activeTool === tool.id
                      ? `border-white/20 bg-white/[0.08]`
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tool.bgColor
                        )}
                      >
                        <span className={tool.color}>{tool.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-white">
                          {tool.name}
                        </h3>
                        <Badge
                          className={cn(
                            "mt-0.5 text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0",
                            tool.bgColor,
                            tool.color,
                            tool.borderColor
                          )}
                        >
                          {tool.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-[12px] text-slate-500 font-medium mb-4 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* HTML Input */}
                  {tool.needsText && activeTool === tool.id && (
                    <div className="mb-4">
                      <textarea
                        value={htmlInput}
                        onChange={(e) => setHtmlInput(e.target.value)}
                        placeholder="Paste HTML table here..."
                        className="w-full h-28 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 p-3 outline-none focus:border-indigo-500/50 resize-none font-mono"
                      />
                      <Button
                        onClick={handleHTMLConvert}
                        disabled={isProcessing || !htmlInput.trim()}
                        className="mt-2 w-full gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-xs"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Convert HTML
                      </Button>
                    </div>
                  )}

                  {/* Action Button */}
                  {tool.needsText ? (
                    <Button
                      onClick={() =>
                        setActiveTool(activeTool === tool.id ? null : tool.id)
                      }
                      variant="outline"
                      className={cn(
                        "w-full gap-2 rounded-xl font-bold text-xs border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all",
                        activeTool === tool.id && "hidden"
                      )}
                    >
                      <Code2 className="h-4 w-4" />
                      Paste HTML
                    </Button>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        className="hidden"
                        accept={tool.acceptTypes}
                        multiple={tool.multiFile}
                        onChange={(e) => {
                          handleToolAction(tool, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <div
                        className="w-full gap-2 rounded-xl font-bold text-xs border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20 cursor-pointer transition-all flex items-center justify-center h-9 px-4"
                      >
                          {isProcessing && activeTool === tool.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {tool.multiFile ? "Select Files" : "Select File"}
                      </div>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
