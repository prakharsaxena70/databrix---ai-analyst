import { useState, useEffect, useRef } from "react";
import { DataPreview as DataPreviewType, ReportData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Rows3,
  Columns3,
  Download,
  Search,
  Table2,
  LayoutGrid,
  Sparkles,
  FileText,
  BarChart3,
  FileSearch,
  ChevronDown,
  Hash,
  DollarSign,
  Users,
  Timer,
  Award,
  Maximize2,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlotlyChart from "./PlotlyChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";

interface DataPreviewProps {
  preview: DataPreviewType;
  filename: string;
  report?: ReportData | null;
  charts?: string[];
  compact?: boolean;
  onDownload?: () => void;
  onExpand?: () => void;
  onExplainData?: () => void;
  defaultTab?: "report" | "chart" | "file";
}

export default function DataPreview({
  preview,
  filename,
  report,
  charts = [],
  compact = false,
  onDownload,
  onExplainData,
  defaultTab,
}: DataPreviewProps) {
  const [activeTab, setActiveTab] = useState<"report" | "chart" | "file">(defaultTab || "file");
  
  // Track previous report/charts to avoid redundant state updates in effect
  const prevReportRef = useRef<ReportData | null | undefined>(report);
  const prevChartsCountRef = useRef<number>(charts.length);
  const prevDefaultTabRef = useRef<typeof defaultTab>(defaultTab);

  // Switch to report tab automatically if a new report arrives or defaultTab changes
  useEffect(() => {
    const isNewReport = report && report !== prevReportRef.current;
    const isNewCharts = charts.length > prevChartsCountRef.current;
    const isNewDefaultTab = defaultTab !== prevDefaultTabRef.current;

    if (isNewDefaultTab && defaultTab) {
      setTimeout(() => setActiveTab(defaultTab), 0);
    } else if (isNewReport) {
      setTimeout(() => setActiveTab("report"), 0);
    }

    prevReportRef.current = report;
    prevChartsCountRef.current = charts.length;
    prevDefaultTabRef.current = defaultTab;
  }, [report, charts.length, defaultTab]);

  if (!preview) return null;

  return (
    <div className="flex flex-col h-full bg-[#0f1117] overflow-hidden text-white">
      {/* Premium Tabbed Navigation */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1117] shrink-0">
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
          <TabButton 
            active={activeTab === "report"} 
            onClick={() => setActiveTab("report")}
            icon={<FileSearch className="h-4 w-4" />}
            label="Report"
          />
          <TabButton 
            active={activeTab === "chart"} 
            onClick={() => setActiveTab("chart")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Chart"
          />
          <TabButton 
            active={activeTab === "file"} 
            onClick={() => setActiveTab("file")}
            icon={<Table2 className="h-4 w-4" />}
            label="File"
          />
        </div>

        <div className="flex items-center gap-2">
          {onExplainData && (
            <Button onClick={onExplainData} variant="outline" size="sm" className="h-9 gap-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 text-[11px] font-bold transition-all px-4 rounded-xl">
              <Sparkles className="h-3.5 w-3.5" />
              Analyze
            </Button>
          )}
          <Button onClick={onDownload} variant="ghost" size="sm" className="h-9 gap-2 text-[11px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all px-4 rounded-xl">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[#0f1117] relative">
        {activeTab === "report" && (
          (report && report.title) ? (
            <ReportView report={report} charts={charts} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <FileSearch className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Report Yet</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Ask a question about your data and the AI will generate a comprehensive analysis report here.
              </p>
              <p className="text-xs text-slate-500 mt-4">Debug: report={JSON.stringify(report)}</p>
            </div>
          )
        )}

        {activeTab === "chart" && (
          <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Visual Analysis</h2>
                <p className="text-xs text-slate-500 font-medium">Auto-generated charts from current response</p>
              </div>
            </div>
            {charts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {charts.map((c, i) => (
                  <div key={i} className="bg-[#1a1d24] border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="h-[400px]">
                      <PlotlyChart dataJson={c} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Charts Yet</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Charts will appear here when the AI generates visualizations based on your data.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "file" && (
          <>
            {/* Full File View */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <FileText className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-[14px] font-bold text-white truncate max-w-[200px]">{filename}</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Full Dataset View</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="h-8 rounded-lg gap-2 px-3 border-white/10 bg-white/10 text-[11px] font-bold text-slate-300">
                   <Rows3 className="h-3.5 w-3.5 text-indigo-400" />
                   {preview.shape.rows.toLocaleString()}
                 </Badge>
                 <Badge variant="outline" className="h-8 rounded-lg gap-2 px-3 border-white/10 bg-white/10 text-[11px] font-bold text-slate-300">
                   <Columns3 className="h-3.5 w-3.5 text-indigo-400" />
                   {preview.shape.columns}
                 </Badge>
              </div>
            </div>

            <div className="p-0">
              <Table className="relative min-w-full">
                <TableHeader className="bg-[#1a1d24] sticky top-0 z-20">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-12 text-center text-[10px] font-black uppercase text-slate-600 p-0 border-r border-white/5 tracking-tighter bg-white/5">
                      IDX
                    </TableHead>
                    {preview.columns.map((col) => {
                      const colName = typeof col === "string" ? col : col.name;
                      const colType = typeof col === "string" ? null : col.dtype;
                      return (
                        <TableHead key={colName} className="px-5 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left min-w-[180px] bg-white/5">
                          <div className="flex items-center justify-between group cursor-pointer hover:text-white transition-colors">
                            <span className="truncate">{colName}</span>
                            <ChevronDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-[#0f1117]">
                  {preview.preview.map((row, i) => (
                    <TableRow key={i} className="group border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="w-12 text-center text-[11px] font-bold text-slate-600 bg-white/5 border-r border-white/5 group-hover:bg-white/10 transition-colors tabular-nums">
                        {i + 1}
                      </TableCell>
                      {preview.columns.map((col) => {
                        const colName = typeof col === "string" ? col : col.name;
                        return (
                          <TableCell key={colName} className="px-5 py-4 text-[13px] text-slate-400 font-medium group-hover:text-slate-200 transition-colors border-r border-white/[0.02]">
                            {(row[colName] ?? "").toString() || <span className="text-slate-700 italic">null</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all",
        active 
          ? "bg-[#1a1d24] text-indigo-400 shadow-sm border border-white/10" 
          : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse ml-0.5" />}
    </button>
  );
}

function ReportView({ report, charts = [] }: { report: ReportData, charts?: string[] }) {
  const [expandedChart, setExpandedChart] = useState<number | null>(null);
  const [visibleCharts, setVisibleCharts] = useState<Set<number>>(new Set(charts.map((_, i) => i)));
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = (chartData: string, title: string) => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteChart = (chartIndex: number) => {
    setVisibleCharts(prev => {
      const newSet = new Set(prev);
      newSet.delete(chartIndex);
      return newSet;
    });
  };

  const handleExportReport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const headerHeight = 20;
      const topStartY = 28;
      const footerTextY = pageHeight - 4.5;
      const footerLineY = pageHeight - 8;
      const bottomLimit = pageHeight - 18;
      const currentDateLabel = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace("T", "_")
        .split(".")[0];

      const normalizePlainText = (value: string) =>
        value
          .replace(/\r/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/^\s{0,3}#{1,6}\s+/gm, "")
          .replace(/^\s*[-*+]\s+/gm, "- ")
          .trim();

      const drawHeader = () => {
        pdf.setFillColor(124, 58, 237);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("DataBrix AI", margin, 8);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Sales Analysis Report", pageWidth - margin, 7.5, { align: "right" });
        pdf.text(currentDateLabel, pageWidth - margin, 15, { align: "right" });

        pdf.setTextColor(15, 23, 42);
      };

      let currentY = topStartY;
      const startNewPage = () => {
        pdf.addPage();
        drawHeader();
        return topStartY;
      };

      const drawWrappedText = (
        rawText: string,
        x: number,
        y: number,
        maxWidth: number,
        options: {
          fontSize: number;
          fontStyle: "normal" | "bold";
          color: [number, number, number];
          lineHeight?: number;
          paragraphGap?: number;
        }
      ) => {
        const cleanedText = normalizePlainText(rawText);
        if (!cleanedText) return y;

        const lineHeight = options.lineHeight ?? Math.max(4.8, options.fontSize * 0.55);
        const paragraphGap = options.paragraphGap ?? lineHeight * 0.35;

        pdf.setFont("helvetica", options.fontStyle);
        pdf.setFontSize(options.fontSize);
        pdf.setTextColor(options.color[0], options.color[1], options.color[2]);

        const paragraphs = cleanedText.split(/\n+/);
        for (const paragraph of paragraphs) {
          const trimmedParagraph = paragraph.trim();
          if (!trimmedParagraph) {
            y += paragraphGap;
            continue;
          }

          const lines = pdf.splitTextToSize(trimmedParagraph, maxWidth) as string[];
          for (const line of lines) {
            if (y + lineHeight > bottomLimit) {
              y = startNewPage();
              pdf.setFont("helvetica", options.fontStyle);
              pdf.setFontSize(options.fontSize);
              pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
            }
            pdf.text(line, x, y);
            y += lineHeight;
          }

          y += paragraphGap;
        }

        return y;
      };

      const drawSectionTitle = (title: string, y: number) =>
        drawWrappedText(title, margin, y, contentWidth, {
          fontSize: 14,
          fontStyle: "bold",
          color: [15, 23, 42],
          lineHeight: 6,
          paragraphGap: 2,
        });

      const drawFormattedSummary = (rawText: string, x: number, y: number, maxWidth: number) => {
        const cleanedText = normalizePlainText(rawText);
        if (!cleanedText) return y;

        const baseFontSize = 10;
        const normalLineHeight = 5;
        const headingLineHeight = 5.5;
        const bulletLineHeight = 5;
        const paragraphs = cleanedText.split(/\n+/);

        for (const paragraph of paragraphs) {
          const line = paragraph.trim();
          if (!line) {
            y += 2;
            continue;
          }

          const isHeading = /^\d+\.\s+/.test(line);
          const isBullet = /^-\s+/.test(line);

          if (isHeading) {
            if (y + 4 > bottomLimit) {
              y = startNewPage();
            }
            y += 4;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(26, 26, 26);

            const headingLines = pdf.splitTextToSize(line, maxWidth) as string[];
            headingLines.forEach((headingLine) => {
              if (y + headingLineHeight > bottomLimit) {
                y = startNewPage();
              }
              pdf.text(headingLine, x, y);
              y += headingLineHeight;
            });

            y += 1;
            continue;
          }

          if (isBullet) {
            const bulletText = line.replace(/^-\s+/, "");
            const colonIndex = bulletText.indexOf(":");
            const label = colonIndex >= 0 ? bulletText.slice(0, colonIndex + 1).trim() : bulletText;
            const remainder = colonIndex >= 0 ? bulletText.slice(colonIndex + 1).trim() : "";

            const labelLines = pdf.splitTextToSize(`- ${label}`, maxWidth) as string[];
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(baseFontSize);
            pdf.setTextColor(51, 51, 51);

            for (const labelLine of labelLines) {
              if (y + bulletLineHeight > bottomLimit) {
                y = startNewPage();
              }
              pdf.text(labelLine, x, y);
              y += bulletLineHeight;
            }

            if (remainder) {
              const remainderLines = pdf.splitTextToSize(remainder, Math.max(maxWidth - 8, 18)) as string[];
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(baseFontSize);
              pdf.setTextColor(51, 51, 51);

              for (const remainderLine of remainderLines) {
                if (y + bulletLineHeight > bottomLimit) {
                  y = startNewPage();
                }
                pdf.text(remainderLine, x + 8, y);
                y += bulletLineHeight;
              }
            }

            y += 1;
            continue;
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(baseFontSize);
          pdf.setTextColor(51, 51, 51);

          const normalLines = pdf.splitTextToSize(line, maxWidth) as string[];
          for (const normalLine of normalLines) {
            if (y + normalLineHeight > bottomLimit) {
              y = startNewPage();
            }
            pdf.text(normalLine, x, y);
            y += normalLineHeight;
          }

          y += 1;
        }

        return y;
      };

      const drawKpiGrid = (kpis: Array<{ label?: string; value?: string | number }>, y: number) => {
        const gap = 4;
        const rowGap = 5;
        const boxWidth = (contentWidth - gap * 2) / 3;
        const boxHeight = 26;
        const rows = 2;
        const totalHeight = rows * boxHeight + rowGap;

        if (y + totalHeight > bottomLimit) {
          y = startNewPage();
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text("Key Performance Indicators", margin, y);
        y += 7;

        for (let row = 0; row < 2; row += 1) {
          const boxY = y + row * (boxHeight + rowGap);

          for (let col = 0; col < 3; col += 1) {
            const index = row * 3 + col;
            const boxX = margin + col * (boxWidth + gap);
            const kpi = kpis[index] || {};
            const label = String(kpi.label || `KPI ${index + 1}`).trim();
            const value = String(kpi.value ?? "N/A").trim();

            pdf.setFillColor(248, 250, 255);
            pdf.setDrawColor(221, 214, 254);
            pdf.setLineWidth(0.4);
            pdf.rect(boxX, boxY, boxWidth, boxHeight, "FD");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(124, 58, 237);
            pdf.text(label, boxX + 4, boxY + 6);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(15, 23, 42);
            const valueLines = pdf.splitTextToSize(value, boxWidth - 8) as string[];
            const valueStartY = boxY + 14;
            const valueLineHeight = 4.5;
            valueLines.slice(0, 2).forEach((line, lineIndex) => {
              pdf.text(line, boxX + 4, valueStartY + lineIndex * valueLineHeight);
            });
          }
        }

        return y + rows * (boxHeight + rowGap) - rowGap;
      };

      const svgToPngDataUrl = async (svg: SVGSVGElement) => {
        const rect = svg.getBoundingClientRect();
        const width = Math.max(Math.round(rect.width || svg.clientWidth || 600), 1);
        const height = Math.max(Math.round(rect.height || svg.clientHeight || 400), 1);

        const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
        clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clonedSvg.setAttribute("width", `${width}`);
        clonedSvg.setAttribute("height", `${height}`);
        clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const serialized = new XMLSerializer().serializeToString(clonedSvg);
        const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);

        try {
          const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const nextImage = new Image();
            nextImage.onload = () => resolve(nextImage);
            nextImage.onerror = () => reject(new Error("Failed to load chart SVG"));
            nextImage.src = objectUrl;
          });

          const canvas = document.createElement("canvas");
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas context unavailable for chart export");
          }

          context.scale(scale, scale);
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);

          return {
            dataUrl: canvas.toDataURL("image/png"),
            width,
            height,
          };
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      drawHeader();

      pdf.setFont("helvetica", "bold");
      currentY = drawWrappedText(report.title || "Analysis Report", margin, currentY, contentWidth, {
        fontSize: 18,
        fontStyle: "bold",
        color: [15, 23, 42],
        lineHeight: 7,
        paragraphGap: 2,
      });

      pdf.setFont("helvetica", "normal");
      currentY = drawWrappedText("AI-Powered Strategic Report", margin, currentY, contentWidth, {
        fontSize: 10,
        fontStyle: "normal",
        color: [124, 58, 237],
        lineHeight: 5,
        paragraphGap: 2,
      });

      currentY += 4;
      currentY = drawSectionTitle("Executive Summary", currentY);
      currentY += 2;

      const summaryText = (report.summary || report.description || "Generating comprehensive summary...")
        .replace(/₹/g, "Rs.")
        .replace(/¹/g, "Rs.");
      currentY = drawFormattedSummary(summaryText, margin, currentY, contentWidth);

      currentY += 4;
      const kpis = Array.isArray(report.kpis) ? report.kpis.slice(0, 6) : [];
      currentY = drawKpiGrid(kpis, currentY);

      const chartVisuals = (report.visuals || []).filter((visual) => visibleCharts.has(visual.chart_index));
      const chartSvgs = reportRef.current
        ? (Array.from(reportRef.current.querySelectorAll(".recharts-wrapper svg")) as SVGSVGElement[])
        : [];

      if (chartVisuals.length > 0 && chartSvgs.length > 0) {
        currentY += 4;
        currentY = drawSectionTitle("Visual Analysis", currentY);
        currentY += 2;

        const chartCount = Math.min(chartVisuals.length, chartSvgs.length);

        for (let index = 0; index < chartCount; index += 1) {
          const visual = chartVisuals[index];
          const svg = chartSvgs[index];
          const chartTitle = visual?.title || `Chart ${index + 1}`;
          const chartImage = await svgToPngDataUrl(svg);

          if (currentY + 6 > bottomLimit) {
            currentY = startNewPage();
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(15, 23, 42);
          pdf.text(chartTitle, margin, currentY);
          currentY += 4;

          const chartAvailableHeight = bottomLimit - currentY;
          const chartScale = Math.min(contentWidth / chartImage.width, chartAvailableHeight / chartImage.height, 1);
          const chartWidth = chartImage.width * chartScale;
          const chartHeight = chartImage.height * chartScale;

          pdf.addImage(chartImage.dataUrl, "PNG", margin, currentY, chartWidth, chartHeight, undefined, "FAST");
          currentY += chartHeight + 5;
        }
      }

      const totalPages = pdf.getNumberOfPages();
      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        pdf.setPage(pageIndex);
        pdf.setDrawColor(124, 58, 237);
        pdf.setLineWidth(0.5);
        pdf.line(0, footerLineY, pageWidth, footerLineY);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Powered by DataBrix AI | Confidential", pageWidth / 2, footerTextY, {
          align: "center",
        });
        pdf.text(`Page ${pageIndex} of ${totalPages}`, pageWidth - margin, footerTextY, {
          align: "right",
        });
      }

      pdf.save(`DataBrix_Report_${timestamp}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF report:", error);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={reportRef}
      className="min-h-full bg-white text-[#1e293b] p-10 font-sans selection:bg-indigo-100"
    >
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Report Header */}
        <div className="border-b border-slate-100 pb-8" data-pdf-border="true">
          <div className="flex items-start justify-between">
            <div>
              <h1 data-pdf-heading="true" className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{report.title}</h1>
              <div data-pdf-muted="true" className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                 <div data-pdf-dot="true" className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                 AI-Powered Strategic Report
              </div>
            </div>
            <button
              onClick={handleExportReport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting PDF..." : "Export Report"}
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="space-y-4">
          <h2 data-pdf-heading="true" className="text-xl font-bold text-slate-800">Executive Summary</h2>
          <div data-pdf-soft-card="true" className="prose prose-slate max-w-none bg-slate-50/50 p-6 rounded-xl border border-slate-100">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-slate-800 mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold text-slate-700 mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="text-[15px] leading-relaxed text-slate-600 mb-4">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="text-[15px] text-slate-600">{children}</li>,
              }}
            >
              {report.summary || report.description || "Generating comprehensive summary..."}
            </ReactMarkdown>
          </div>
        </section>

        {/* KPIs Grid */}
        {(report.kpis || report.metrics) && (
          <section className="space-y-4">
            <h2 data-pdf-heading="true" className="text-xl font-bold text-slate-800">Key Performance Indicators</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(report.kpis || report.metrics || []).map((kpi, i) => (
                <div 
                  key={i} 
                  data-pdf-kpi-card="true"
                  className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <p data-pdf-accent="true" className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{kpi.label}</p>
                  <p data-pdf-heading="true" className="text-[20px] font-bold text-slate-900">{kpi.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Visual Analysis with Chart Cards */}
        {report.visuals && report.visuals.length > 0 && (
          <section className="space-y-8 pt-4">
            <h2 data-pdf-heading="true" className="text-xl font-bold text-slate-800">Visual Analysis</h2>
            <div className="space-y-8">
              {report.visuals.map((visual, i) => {
                const chartData = charts[visual.chart_index];
                if (!chartData || !visibleCharts.has(visual.chart_index)) return null;
                
                return (
                  <div key={i} data-pdf-soft-card="true" className="bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden w-full">
                    {/* Chart Header with Actions */}
                    <div data-pdf-card="true" className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                      <div>
                        <h3 data-pdf-heading="true" className="text-[16px] font-bold text-slate-800">{visual.title}</h3>
                        <p data-pdf-muted="true" className="text-[12px] text-slate-500 mt-0.5">{visual.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedChart(visual.chart_index)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Expand"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDownload(chartData, visual.title)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteChart(visual.chart_index)}
                          className="p-2 rounded-lg hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chart Content - Full Width */}
                    <div className="p-6">
                      <div data-pdf-card="true" className="h-[450px] bg-white rounded-xl border border-slate-100 shadow-sm">
                        <PlotlyChart dataJson={chartData} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Expanded Chart Modal */}
        {expandedChart !== null && charts[expandedChart] && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setExpandedChart(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h3 className="text-[18px] font-bold text-slate-800">
                    {report.visuals?.[expandedChart]?.title || 'Chart'}
                  </h3>
                  <p className="text-[13px] text-slate-500">
                    {report.visuals?.[expandedChart]?.description || 'Data visualization'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload(charts[expandedChart], report.visuals?.[expandedChart]?.title || 'chart')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-[13px] font-medium">Download</span>
                  </button>
                  <button 
                    onClick={() => setExpandedChart(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 bg-slate-50">
                <div className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <PlotlyChart dataJson={charts[expandedChart]} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Traditional Table View (only if present) */}
        {report.rows && report.rows.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 data-pdf-heading="true" className="text-xl font-bold text-slate-800">{report.table_title || "Detailed Data View"}</h2>
            <div data-pdf-card="true" className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader data-pdf-table-head="true" className="bg-slate-50">
                  <TableRow>
                    {(report.columns || Object.keys(report.rows[0])).map(col => (
                      <TableHead key={col} data-pdf-muted="true" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-12 px-5">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 border-slate-50 transition-colors h-12">
                      {(report.columns || Object.keys(row)).map(col => (
                        <TableCell key={col} className="text-[13px] text-slate-600 px-5">
                          {row[col]?.toString() || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {report.rows.length > 10 && (
              <p data-pdf-muted="true" className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                Showing top 10 of {report.rows.length} records. See &apos;File&apos; tab for complete dataset.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
