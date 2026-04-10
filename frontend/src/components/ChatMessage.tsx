"use client";

import { useState, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import PlotlyChart, { downloadChartPayload } from "./PlotlyChart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  CheckCircle2,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Lightbulb,
  Medal,
  Crown,
  Sparkles,
  Maximize2,
  Download,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  isLoading?: boolean;
  streamingSteps?: string[];
  streamingSections?: Record<string, string>;
  processingSteps?: Array<{ id: string; label: string; status: string }>;
}

export function ChatMessageComponent({ message, isLoading = false, streamingSteps = [], streamingSections = {}, processingSteps = [] }: ChatMessageProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    charts: true,
    findings: true,
  });

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-[20px] rounded-br-md text-[15px] leading-relaxed shadow-lg shadow-indigo-500/25">
          {message.content}
        </div>
      </div>
    );
  }

  const sections = parseMessageContent(message.content);
  const allCharts = message.charts || (message.plotly_json ? [message.plotly_json] : []);
  
  // Merge streaming sections with parsed sections
  const mergedSections = {
    ...sections,
    ...streamingSections,
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Live Processing Steps with Animations */}
      {processingSteps.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
            <h4 className="text-[15px] font-bold text-indigo-800">Analyzing Your Data</h4>
          </div>
          <div className="space-y-3">
            {processingSteps.map((step, idx) => (
              <div 
                key={step.id} 
                className="flex items-center gap-3 text-[14px] animate-in fade-in slide-in-from-left-3 duration-500"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {step.status === 'complete' ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : step.status === 'running' ? (
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
                )}
                <span className={cn(
                  "transition-colors duration-300",
                  step.status === 'complete' ? "text-slate-700 font-medium" : 
                  step.status === 'running' ? "text-indigo-700 font-semibold" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Analysis Content - Detailed Text */}
      {message.content && (
        <div className="text-[14px] text-slate-600 leading-relaxed bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-100 shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Analysis Status Indicators (Pandada Style) */}
      <div className="space-y-3 my-2">
        {/* Report Card */}
        {message.report && (
          <div className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800">Report created</p>
                <p className="text-[11px] text-slate-400 font-medium">{message.report.title}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
               <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Inline Chart Thumbnails */}
        {allCharts.length > 0 && (
          <div className="flex flex-col gap-4 w-full max-w-[420px]">
            {allCharts.map((chart, idx) => (
              <InlineChartThumbnail 
                key={idx} 
                chart={chart} 
                title={message.report?.visuals?.[idx]?.title || `Chart ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {sections.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-emerald-600" />
            <h4 className="text-[14px] font-bold text-emerald-800">Strategic Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {sections.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[14px] text-emerald-900">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[11px] font-bold">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading Animation */}
      {isLoading && <LoadingAnimation />}
    </div>
  );
}

// Analysis Step with Animation
function AnalysisStep({ step, index, isStreaming = false }: { step: string; index: number; isStreaming?: boolean }) {
  const [isVisible, setIsVisible] = useState(isStreaming);
  
  useEffect(() => {
    if (isStreaming) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(true), index * 400);
      return () => clearTimeout(timer);
    }
  }, [index, isStreaming]);

  return (
    <div 
      className={cn(
        "flex items-center gap-3 text-[14px] transition-all duration-500",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-10px]"
      )}
    >
      <CheckCircle2 className={cn(
        "h-4 w-4 flex-shrink-0 transition-colors duration-300",
        isVisible ? "text-emerald-500" : "text-slate-300"
      )} />
      <span className={cn(
        "transition-colors duration-300",
        isVisible ? "text-black" : "text-slate-400"
      )}>
        {step}
      </span>
      {isVisible && (
        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
          &lt;/&gt;
        </span>
      )}
    </div>
  );
}

// Loading Animation
function LoadingAnimation() {
  const [step, setStep] = useState(0);
  
  const steps = [
    "Analyzing dataset structure...",
    "Processing data patterns...",
    "Generating visualizations...",
    "Extracting insights...",
    "Finalizing recommendations...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative">
        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-indigo-300 rounded-full animate-spin [animation-duration:1.5s]" />
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-black">DataBrix is analyzing</span>
        <span className="text-[11px] text-black/60 animate-pulse">{steps[step]}</span>
      </div>
      <div className="flex gap-1 ml-2">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

// Parse message content into sections
function parseMessageContent(content: string) {
  const sections: {
    intro: string;
    steps: string[];
    analysisComplete: string;
    summary: string;
    findings: string[];
    recommendations: string[];
    topPerformers: Array<{ label: string; value: string }>;
  } = {
    intro: "",
    steps: [],
    analysisComplete: "",
    summary: "",
    findings: [],
    recommendations: [],
    topPerformers: [],
  };

  const lines = content.split('\n');
  let currentSection = 'intro';

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Analysis steps (checkmarks or bullet points)
    if (trimmed.match(/^[✓✔☑-]\s/i) || trimmed.match(/^(Set|Convert|Create|Analyze|Upload|Explore|Generate)\s/i)) {
      const stepText = trimmed.replace(/^[✓✔☑-]\s*/, '').replace(/&lt;\/&gt;/g, '').trim();
      if (stepText && !sections.steps.includes(stepText)) {
        sections.steps.push(stepText);
      }
      currentSection = 'steps';
      return;
    }

    // Analysis complete header
    if (trimmed.match(/comprehensive.*analysis.*complete/i) || trimmed.match(/analysis.*complete/i)) {
      sections.analysisComplete = trimmed;
      currentSection = 'complete';
      return;
    }

    // Top performers
    const performerMatch = trimmed.match(/^\*?\*?(Best|Top)\s+([^:]+):\*?\*?\s*(.+)/i);
    if (performerMatch) {
      sections.topPerformers.push({
        label: `${performerMatch[1]} ${performerMatch[2]}`,
        value: performerMatch[3].trim(),
      });
      currentSection = 'performers';
      return;
    }

    // Key findings
    if (trimmed.match(/^key\s+findings?/i)) {
      currentSection = 'findings';
      return;
    }
    if (currentSection === 'findings' && trimmed.match(/^[-•]/)) {
      sections.findings.push(trimmed.replace(/^[-•]\s*/, ''));
      return;
    }

    // Recommendations
    if (trimmed.match(/recommendations?/i)) {
      currentSection = 'recommendations';
      return;
    }
    if (currentSection === 'recommendations' && trimmed.match(/^[-•]/)) {
      sections.recommendations.push(trimmed.replace(/^[-•]\s*/, ''));
      return;
    }

    // Collect intro text
    if (currentSection === 'intro' && trimmed && !trimmed.startsWith('**')) {
      sections.intro += trimmed + ' ';
    }

    // Summary after "complete" header
    if (currentSection === 'complete' && trimmed && !trimmed.startsWith('**')) {
      sections.summary += trimmed + '\n';
    }
  });

  sections.intro = sections.intro.trim();
  sections.summary = sections.summary.trim();

  return sections;
}

// Markdown components with black text
const MarkdownComponents: any = {
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-bold text-black">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-black/80">{children}</em>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 text-black">{children}</p>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl font-bold text-black mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg font-bold text-black mt-3 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base font-bold text-black mt-3 mb-1">{children}</h3>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 text-black space-y-1">{children}</ul>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-black">{children}</li>
  ),
};

// Inline Chart Thumbnail Component - Clean Design
function InlineChartThumbnail({ chart, title }: { chart: any; title: string }) {
  const handleDownloadPNG = () => {
    downloadChartPayload(chart, title);
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden w-[400px]">
      {/* Header with Title and Download Button Only */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <p className="text-[14px] font-semibold text-slate-800 truncate flex-1">{title}</p>
        <button 
          onClick={handleDownloadPNG}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          title="Download chart data"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
      
      {/* Chart Preview */}
      <div className="h-[250px] p-3">
        <div className="w-full h-full rounded-lg overflow-hidden bg-slate-50/30">
          <PlotlyChart dataJson={chart} showToolbar={false} height="100%" />
        </div>
      </div>
    </div>
  );
}

// Typing Indicator with Processing Steps
export function TypingIndicator({ processingSteps = [] }: { processingSteps?: Array<{ id: string; label: string; status: string }> }) {
  if (processingSteps.length > 0) {
    return (
      <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-[320px]">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
            <span className="text-[13px] font-semibold text-indigo-800">Analyzing your data</span>
          </div>
          <div className="space-y-2">
            {processingSteps.map((step, idx) => (
              <div 
                key={step.id}
                className="flex items-center gap-2 text-[12px] animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {step.status === 'complete' ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                  </div>
                ) : step.status === 'running' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                )}
                <span className={cn(
                  "transition-colors duration-300",
                  step.status === 'complete' ? "text-slate-600" : 
                  step.status === 'running' ? "text-indigo-700 font-medium" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <LoadingAnimation />
      </div>
    </div>
  );
}

// Chat Loading Skeleton
export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-[85%]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="space-y-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="w-full h-3 rounded bg-slate-200 animate-pulse" />
        <div className="w-[90%] h-3 rounded bg-slate-200 animate-pulse" />
        <div className="w-[80%] h-3 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
