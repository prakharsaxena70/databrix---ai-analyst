"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessageComponent, ChatLoadingSkeleton, TypingIndicator } from "./ChatMessage";
import { ChatMessage } from "@/lib/types";
import { sendMessageStream, enhancePrompt, explainData } from "@/lib/api";
import {
  Paperclip,
  FileText,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Globe,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  sessionId: string;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onGenerateReport: (payload?: { report?: any | null; charts?: any[] }) => void;
  isThinking?: boolean;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  currentFile: { filename: string; preview: any } | null;
  isUploading: boolean;
  onShowTools?: () => void;
}

export default function ChatInterface({
  sessionId,
  messages,
  onNewMessage,
  onGenerateReport,
  isThinking = false,
  onFileSelect,
  onRemoveFile,
  currentFile,
  isUploading,
  onShowTools,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportGenerationInProgressRef = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    onFileSelect(file);
    e.target.value = "";
  };

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(input);
      if (enhanced && enhanced !== input && enhanced.length > 5) {
        setInput(enhanced);
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleExplainData = async () => {
    console.log("handleExplainData called");
    setIsLoading(true);
    try {
      console.log("Calling explainData API...");
      const data = await explainData(sessionId);
      console.log("explainData response:", data);
      const content = `**Data Summary:**\n\n${data.summary}\n\n**Shape:** ${data.shape}\n**Columns:** ${data.columns} | **Rows:** ${data.rows.toLocaleString()}`;

      const assistantMsg: ChatMessage = { 
        role: "assistant", 
        content,
        report: data.report || null,
        charts: data.charts || []
      };
      
      console.log("handleExplainData sending message with report:", data.report, "and charts:", data.charts?.length);
      onNewMessage(assistantMsg);
    } catch (err) {
      console.error("handleExplainData error:", err);
      const errorText = err instanceof Error ? err.message : "Failed to explain data";
      setError(errorText);
      const assistantMsg: ChatMessage = { role: "assistant", content: `**Error:** ${errorText}` };
      onNewMessage(assistantMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const runBackgroundReportGeneration = useCallback(async () => {
    if (!sessionId || reportGenerationInProgressRef.current) return;
    reportGenerationInProgressRef.current = true;
    try {
      const data = await explainData(sessionId);
      onGenerateReport({
        report: data.report || null,
        charts: data.charts || [],
      });
    } catch (err) {
      console.error("Background report generation failed:", err);
    } finally {
      reportGenerationInProgressRef.current = false;
    }
  }, [sessionId, onGenerateReport]);

  const [streamingContent, setStreamingContent] = useState<{
    steps: string[];
    processingSteps: Array<{ id: string; label: string; status: string }>;
    sections: Record<string, string>;
    charts: string[];
    isComplete: boolean;
  }>({
    steps: [],
    processingSteps: [],
    sections: {},
    charts: [],
    isComplete: false,
  });

  const handleSend = async (
    retryContent?: string,
    options: { showUserBubble?: boolean } = {}
  ) => {
    const q = (retryContent || input).trim();
    const showUserBubble = options.showUserBubble !== false;
    console.log("handleSend called with:", q, "sessionId:", sessionId);
    if (!q || !sessionId || isLoading) {
      console.log("handleSend early return - missing data");
      return;
    }

    if (!retryContent) {
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
    
    setIsLoading(true);
    setError(null);
    setFailedMessage(null);
    setStreamingContent({
      steps: [],
      processingSteps: [],
      sections: {},
      charts: [],
      isComplete: false,
    });

    const userMsg: ChatMessage = { role: "user", content: q };
    if (showUserBubble) {
      // Add the user message immediately so it renders before the assistant starts streaming.
      onNewMessage(userMsg);
    }

    try {
      console.log("Starting sendMessageStream...");
      let finalText = "";
      let finalCharts: string[] = [];
      let finalCode = "";
      let finalReport = null;

      await sendMessageStream(sessionId, q, (chunk) => {
        console.log("Stream chunk received:", chunk.type);
        switch (chunk.type) {
          case "step":
            setStreamingContent((prev) => ({
              ...prev,
              steps: [...prev.steps, chunk.content || ""],
            }));
            break;
          case "steps":
            setStreamingContent((prev) => ({
              ...prev,
              processingSteps: chunk.steps || [],
            }));
            break;
          case "section":
            setStreamingContent((prev) => ({
              ...prev,
              sections: {
                ...prev.sections,
                [chunk.section || ""]: chunk.content || "",
              },
            }));
            break;
          case "charts":
            setStreamingContent((prev) => ({
              ...prev,
              charts: new Array(chunk.count || 0).fill(""),
            }));
            break;
          case "complete":
            finalText = chunk.text || "";
            finalCharts = chunk.charts || [];
            finalCode = chunk.code || "";
            finalReport = chunk.report || null;
            
            console.log("[ChatInterface] Complete chunk received:", {
              textLength: finalText?.length,
              chartsCount: finalCharts?.length,
              hasReport: !!finalReport,
              reportTitle: finalReport?.title,
              reportKpisCount: finalReport?.kpis?.length,
              reportSummaryLength: finalReport?.summary?.length
            });
            
            setStreamingContent((prev) => ({
              ...prev,
              charts: finalCharts,
              isComplete: true,
            }));
            break;
          case "error":
            throw new Error(chunk.content || "Stream error");
        }
      });

      // Create final message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: finalText,
        plotly_json: finalCharts[0] || null,
        charts: finalCharts,
        code: finalCode,
        report: finalReport,
      };
      console.log("Stream complete, sending message:", {
        hasCharts: finalCharts.length > 0,
        hasReport: !!finalReport,
        reportTitle: finalReport?.title,
        chartsCount: finalCharts.length
      });
      onNewMessage(assistantMsg);
      // Silent background report refresh after every successful AI reply.
      setTimeout(() => {
        void runBackgroundReportGeneration();
      }, 0);
    } catch (err) {
      console.error("handleSend error:", err);
      const errorText = err instanceof Error ? err.message : "Failed to get response";
      setError(errorText);
      setFailedMessage(q);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `**Error:** ${errorText}`,
      };
      onNewMessage(errorMsg);
    } finally {
      setIsLoading(false);
      setStreamingContent({
        steps: [],
        processingSteps: [],
        sections: {},
        charts: [],
        isComplete: false,
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    if (failedMessage) {
      handleSend(failedMessage, { showUserBubble: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasAutoTriggeredRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !hasAutoTriggeredRef.current && messages.length === 0 && !isLoading) {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        hasAutoTriggeredRef.current = true;
        // Clean URL to avoid loops
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSend(q, { showUserBubble: false });
      }
    }
  }, [messages.length, isLoading]);

  // Show empty state
  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {/* File Chip at Top */}
        {currentFile && (
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{currentFile.filename}</p>
                  <p className="text-[11px] text-slate-500">{currentFile.preview.shape.rows.toLocaleString()} rows</p>
                </div>
                <button 
                  onClick={onRemoveFile}
                  className="ml-1 p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {showEmptyState && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                <span className="text-2xl font-bold text-white">B</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Ready to analyze your data</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Upload a file and ask any question about it, or let our AI generate a comprehensive summary of your dataset automatically.</p>
              
              <button 
                onClick={handleExplainData}
                disabled={isLoading || isUploading || !currentFile}
                className="group relative px-6 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-700">Explain My Data</p>
                    <p className="text-[11px] font-medium text-slate-500">Generate an AI executive summary</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLastAssistant = i === messages.length - 1 && msg.role === "assistant";
            return (
              <MessageBubble
                key={i}
                message={msg}
                isLast={i === messages.length - 1}
                onRetry={msg.role === "assistant" && msg.content.startsWith("**Error:**") ? handleRetry : undefined}
                streamingSteps={isLastAssistant && isLoading ? streamingContent.steps : []}
                streamingSections={isLastAssistant && isLoading ? streamingContent.sections : {}}
                processingSteps={isLastAssistant && isLoading ? streamingContent.processingSteps : []}
              />
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start">
              <TypingIndicator processingSteps={streamingContent.processingSteps} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-indigo-300 transition-all">
            <div className="flex items-start gap-3 p-3">
              <button
                type="button"
                onClick={triggerFileUpload}
                className="mt-1 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What data or problem to analyze? Type @ for mentions and / for shortcuts."
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-800 placeholder:text-slate-400 resize-none py-2 min-h-[40px] max-h-[120px]"
              />
              
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "mt-1 p-2 rounded-xl transition-all",
                  input.trim()
                    ? "bg-slate-800 text-white hover:bg-slate-700 shadow-md"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnhance}
              disabled={isEnhancing || !input.trim()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                isEnhancing || !input.trim()
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance
                </>
              )}
            </button>

            <button
              onClick={() => {
                onGenerateReport();
                void runBackgroundReportGeneration();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Generate Report
            </button>

            <button
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(input || 'data analysis')}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              Web Search
            </button>

            <div className="flex-1" />
            
            <span className="text-[11px] text-slate-400">
              AI may make mistakes. Please verify important information.
            </span>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.pdf"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isLast,
  onRetry,
  streamingSteps = [],
  streamingSections = {},
  processingSteps = [],
}: {
  message: ChatMessage;
  isLast: boolean;
  onRetry?: () => void;
  streamingSteps?: string[];
  streamingSections?: Record<string, string>;
  processingSteps?: Array<{ id: string; label: string; status: string }>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-[20px] rounded-br-md text-[15px] leading-relaxed shadow-lg shadow-indigo-500/20">
          {message.content}
        </div>
      </div>
    );
  }

  const isError = message.content.startsWith("**Error:**");

  return (
    <div className="flex flex-col items-start w-full">
      <div className={cn(
        "max-w-[95%] w-full space-y-2",
        isError && "opacity-80"
      )}>
        <div className={cn(
          "bg-white border rounded-2xl rounded-bl-md p-5 shadow-sm",
          isError ? "border-red-200 bg-red-50" : "border-slate-200"
        )}>
          <ChatMessageComponent 
            message={message} 
            streamingSteps={streamingSteps}
            streamingSections={streamingSections}
            processingSteps={processingSteps}
          />
        </div>

        {/* Message Actions */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
