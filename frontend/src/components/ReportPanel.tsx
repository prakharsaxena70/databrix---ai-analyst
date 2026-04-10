"use client";

import { useState, useMemo } from "react";
import { ChatMessage } from "@/lib/types";
import PlotlyChart from "./PlotlyChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  FileText,
  BarChart3,
  Download,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Clock,
  ChevronDown,
  ChevronUp,
  PieChart,
  Activity,
  Database,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ReportPanelProps {
  messages: ChatMessage[];
  filename: string;
  rowCount: number;
  columnCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportPanel({ 
  messages, 
  filename, 
  rowCount, 
  columnCount,
  isOpen,
  onClose 
}: ReportPanelProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  const report = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // Extract all charts
    const allCharts: string[] = [];
    assistantMessages.forEach(msg => {
      if (msg.charts && msg.charts.length > 0) {
        allCharts.push(...msg.charts);
      } else if (msg.plotly_json) {
        allCharts.push(msg.plotly_json);
      }
    });
    
    // Parse content for sections
    const sections = parseReportContent(assistantMessages.map(m => m.content).join('\n\n'));
    
    return {
      charts: allCharts,
      sections,
      messageCount: messages.length,
      assistantCount: assistantMessages.length,
    };
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-[#0f1117] border-l border-white/5">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1117]/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-[15px] font-bold text-white">Executive Report</h2>
            <p className="text-[11px] text-slate-500">McKinsey-Grade Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        {/* Title Section */}
        <div className="text-center pb-6 border-b border-white/5">
          <h1 className="text-2xl font-black text-white mb-2">{filename.replace(/\.[^/.]+$/, '')}</h1>
          <p className="text-sm text-slate-400">Comprehensive Data Analysis Report</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              {rowCount.toLocaleString()} rows
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              {columnCount} columns
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        {report.sections.executiveSummary && (
          <ReportSection 
            title="Executive Summary" 
            icon={<Target className="h-4 w-4" />}
            isActive={activeSection === 'executive'}
            onToggle={() => setActiveSection(activeSection === 'executive' ? null : 'executive')}
          >
            <div className="text-[14px] text-white leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {report.sections.executiveSummary}
              </ReactMarkdown>
            </div>
          </ReportSection>
        )}

        {/* Key Metrics */}
        {report.sections.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {report.sections.metrics.slice(0, 4).map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  {idx === 0 && <TrendingUp className="h-4 w-4" />}
                  {idx === 1 && <PieChart className="h-4 w-4" />}
                  {idx === 2 && <Activity className="h-4 w-4" />}
                  {idx === 3 && <Target className="h-4 w-4" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</span>
                </div>
                <p className="text-xl font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Critical Issues */}
        {report.sections.criticalIssues.length > 0 && (
          <ReportSection 
            title="Critical Issues" 
            icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
            isActive={activeSection === 'issues'}
            onToggle={() => setActiveSection(activeSection === 'issues' ? null : 'issues')}
            variant="warning"
          >
            <ul className="space-y-3">
              {report.sections.criticalIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] text-white">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[12px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{issue}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* Visualizations */}
        {report.charts.length > 0 && (
          <ReportSection 
            title={`Visualizations (${report.charts.length})`}
            icon={<BarChart3 className="h-4 w-4 text-indigo-400" />}
            isActive={activeSection === 'charts'}
            onToggle={() => setActiveSection(activeSection === 'charts' ? null : 'charts')}
            defaultOpen={true}
          >
            <div className={cn(
              "grid gap-4",
              report.charts.length === 1 ? "grid-cols-1" :
              report.charts.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              "grid-cols-1 md:grid-cols-2"
            )}>
              {report.charts.map((chart, idx) => (
                <div key={idx} className="bg-[#1a1d24] rounded-xl border border-white/10 p-4">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-3">Chart {idx + 1}</p>
                  <div className="h-[250px]">
                    <PlotlyChart dataJson={chart} />
                  </div>
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* Key Findings */}
        {report.sections.keyFindings && (
          <ReportSection 
            title="Key Findings" 
            icon={<Lightbulb className="h-4 w-4 text-amber-400" />}
            isActive={activeSection === 'findings'}
            onToggle={() => setActiveSection(activeSection === 'findings' ? null : 'findings')}
          >
            <div className="text-[14px] text-white leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {report.sections.keyFindings}
              </ReactMarkdown>
            </div>
          </ReportSection>
        )}

        {/* Recommendations */}
        {report.sections.recommendations && (
          <ReportSection 
            title="Strategic Recommendations" 
            icon={<Target className="h-4 w-4 text-emerald-400" />}
            isActive={activeSection === 'recommendations'}
            onToggle={() => setActiveSection(activeSection === 'recommendations' ? null : 'recommendations')}
          >
            <div className="text-[14px] text-white leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {report.sections.recommendations}
              </ReactMarkdown>
            </div>
          </ReportSection>
        )}

        {/* Full Analysis */}
        {report.sections.fullContent && (
          <ReportSection 
            title="Detailed Analysis" 
            icon={<FileText className="h-4 w-4 text-slate-400" />}
            isActive={activeSection === 'full'}
            onToggle={() => setActiveSection(activeSection === 'full' ? null : 'full')}
          >
            <div className="text-[14px] text-white leading-relaxed prose prose-invert prose-sm max-w-none [&_*]:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {report.sections.fullContent}
              </ReactMarkdown>
            </div>
          </ReportSection>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[11px] text-slate-500">
            Generated by DataBrix AI • {report.messageCount} interactions • {report.charts.length} visualizations
          </p>
        </div>
      </div>
    </div>
  );
}

// Report Section Component
function ReportSection({ 
  title, 
  icon, 
  children, 
  isActive, 
  onToggle,
  variant = 'default',
  defaultOpen = false
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
  variant?: 'default' | 'warning';
  defaultOpen?: boolean;
}) {
  const isOpen = isActive !== null ? isActive : defaultOpen;
  
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      variant === 'warning' 
        ? "bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20" 
        : "bg-[#1a1d24] border-white/10"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            variant === 'warning' ? "bg-orange-500/10" : "bg-white/5"
          )}>
            {icon}
          </div>
          <span className="text-[15px] font-bold text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Parse report content into sections
function parseReportContent(content: string) {
  const sections: {
    executiveSummary: string;
    keyFindings: string;
    recommendations: string;
    criticalIssues: string[];
    metrics: Array<{ label: string; value: string }>;
    fullContent: string;
  } = {
    executiveSummary: '',
    keyFindings: '',
    recommendations: '',
    criticalIssues: [],
    metrics: [],
    fullContent: content,
  };

  // Extract Executive Summary
  const execMatch = content.match(/(?:\*\*)?Executive Summary(?:\*\*)?[:\n]+([\s\S]*?)(?=\n\n(?:\*\*)?(?:Key Insights?|Key Findings|Critical Issues|Notable Findings|Recommendations)|\n#{1,3}\s|$)/i);
  if (execMatch) {
    sections.executiveSummary = execMatch[1].trim();
  }

  // Extract Key Findings/Insights
  const findingsMatch = content.match(/(?:\*\*)?(?:Key Insights?|Key Findings)(?:\*\*)?[:\n]+([\s\S]*?)(?=\n\n(?:\*\*)?(?:Critical Issues|Notable Findings|Recommendations|Executive Summary)|\n#{1,3}\s|$)/i);
  if (findingsMatch) {
    sections.keyFindings = findingsMatch[1].trim();
  }

  // Extract Recommendations
  const recMatch = content.match(/(?:\*\*)?(?:Recommendations?)(?:\*\*)?[:\n]+([\s\S]*?)(?=\n\n(?:\*\*)?(?:Critical Issues|Key Insights?|Notable Findings|Executive Summary)|\n#{1,3}\s|$)/i);
  if (recMatch) {
    sections.recommendations = recMatch[1].trim();
  }

  // Extract Critical Issues
  const criticalMatch = content.match(/(?:\*\*)?(?:Critical Issues?)(?:\*\*)?[:\n]+([\s\S]*?)(?=\n\n(?:\*\*)?(?:Key Insights?|Key Findings|Notable Findings|Recommendations|Executive Summary)|\n#{1,3}\s|$)/i);
  if (criticalMatch) {
    sections.criticalIssues = criticalMatch[1]
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.|^[-•]/))
      .map(line => line.replace(/^\d+\.\s*|^[-•]\s*/, '').trim());
  }

  // Extract metrics
  const metricPatterns = [
    { pattern: /(?:total|revenue).*?[:\-]?\s*\$?([\d,]+(?:\.\d{2})?)/i, label: 'Total Value' },
    { pattern: /([\d,]+(?:\.\d{1,2})?)%/, label: 'Percentage' },
    { pattern: /([\d,]+)\s+(?:rows?|records?)/i, label: 'Records' },
  ];

  metricPatterns.forEach(({ pattern, label }) => {
    const match = content.match(pattern);
    if (match && sections.metrics.length < 4) {
      sections.metrics.push({ label, value: match[1] });
    }
  });

  return sections;
}

// Custom markdown components with white text
const MarkdownComponents: any = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl font-black text-white mt-4 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base font-bold text-white mt-3 mb-2">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-white leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="space-y-2 my-3 text-white">{children}</ul>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-white">
      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-slate-200">{children}</em>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-indigo-500 pl-4 my-3 text-slate-200">
      {children}
    </blockquote>
  ),
};
