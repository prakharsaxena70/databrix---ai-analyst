"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import PDFImageViewer from "@/components/PDFImageViewer";
import DataPreviewComponent from "@/components/DataPreview";
import { getSession, uploadFile } from "@/lib/api";
import { ChatMessage, DataPreview, PDFData } from "@/lib/types";
import { Loader2, FileImage } from "lucide-react";


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentFile, setCurrentFile] = useState<{ filename: string; preview: DataPreview; pdfData?: PDFData } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportKey, setReportKey] = useState(0); // Used to trigger report view refresh
  const [autoOpenReport, setAutoOpenReport] = useState(false); // Track if we should auto-open report tab
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [generatedCharts, setGeneratedCharts] = useState<any[]>([]);

  // Load session data when page loads
  useEffect(() => {
    if (!sessionId) return;
    
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const session = await getSession(sessionId);
        
        if (session) {
          setMessages(session.messages || []);
          setCurrentFile({
            filename: session.filename,
            preview: {
              shape: session.file_meta?.shape || { rows: 0, columns: 0 },
              columns: session.file_meta?.columns || [],
              preview: session.file_meta?.preview || [],
            },
            pdfData: session.file_meta?.pdf_data,
          });
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        setError("Failed to load chat session");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleNewMessage = (message: ChatMessage) => {
    console.log("[ChatPage] New message:", {
      role: message.role,
      hasCharts: message.charts && message.charts.length > 0,
      hasReport: !!message.report,
      reportTitle: message.report?.title,
    });
    setMessages((prev) => [...prev, message]);
  };

  // Auto-trigger report view when analysis completes and auto-open report tab
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    console.log("[ChatPage] Checking last message:", {
      role: lastMessage?.role,
      hasCharts: lastMessage?.charts && lastMessage.charts.length > 0,
      chartsCount: lastMessage?.charts?.length,
      hasReport: !!lastMessage?.report,
      reportTitle: lastMessage?.report?.title
    });
    
    if (lastMessage?.role === "assistant" && ((lastMessage.charts && lastMessage.charts.length > 0) || lastMessage.report)) {
      console.log("[ChatPage] Auto-opening report tab");
      // Trigger report view refresh
      setReportKey(prev => prev + 1);
      // Auto-open the report tab
      setAutoOpenReport(true);
    }
  }, [messages]);

  const handleGenerateReport = (payload?: { report?: any | null; charts?: any[] }) => {
    if (payload?.report) {
      setGeneratedReport(payload.report);
    }
    if (payload?.charts && payload.charts.length > 0) {
      setGeneratedCharts(payload.charts);
    }
    // Trigger report view and auto-open report tab
    setReportKey(prev => prev + 1);
    setAutoOpenReport(true);
    console.log("Generate Report clicked - showing report view");
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadFile(file);
      
      // Update URL to new session
      router.push(`/app/chat/${response.session_id}`);
      
      setCurrentFile({
        filename: response.filename,
        preview: response.preview,
        pdfData: response.pdf_data,
      });
      setMessages([]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/app")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasPdfImages = currentFile?.pdfData && (currentFile.pdfData.images.length > 0 || currentFile.pdfData.pages.length > 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {hasPdfImages ? (
        <div className="flex h-full">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatInterface
              sessionId={sessionId}
              messages={messages}
              onNewMessage={handleNewMessage}
              onGenerateReport={handleGenerateReport}
              isThinking={false}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              currentFile={currentFile}
              isUploading={isUploading}
            />
          </div>
          
          {/* PDF Images Sidebar */}
          <div className="w-[400px] border-l border-slate-200 bg-slate-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Document Images
              </h3>
              <PDFImageViewer 
                images={currentFile!.pdfData!.images} 
                pages={currentFile!.pdfData!.pages} 
              />
            </div>
          </div>
        </div>
      ) : currentFile && currentFile.preview ? (
        <div className="flex h-full">
          {/* Main Chat Area */}
          <div className="flex-1 lg:flex-none lg:w-[45%] flex flex-col border-r border-slate-200">
            <ChatInterface
              sessionId={sessionId}
              messages={messages}
              onNewMessage={handleNewMessage}
              onGenerateReport={handleGenerateReport}
              isThinking={false}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              currentFile={currentFile}
              isUploading={isUploading}
            />
          </div>
          
          {/* Data Preview Sidebar */}
          <div className="hidden lg:block lg:flex-1 bg-slate-50 overflow-hidden">
            <DataPreviewComponent 
              key={reportKey}
              preview={currentFile.preview} 
              filename={currentFile.filename}
              report={(() => {
                const lastReport = messages.slice().reverse().find(m => m.role === "assistant" && m.report);
                console.log("[ChatPage] DataPreview report:", lastReport?.report?.title || "No report");
                return lastReport?.report || generatedReport || null;
              })()}
              charts={(() => {
                const lastCharts = messages.slice().reverse().find(m => m.role === "assistant" && m.charts && m.charts.length > 0);
                console.log("[ChatPage] DataPreview charts:", lastCharts?.charts?.length || 0);
                return lastCharts?.charts || generatedCharts || [];
              })()}
              defaultTab={autoOpenReport ? "report" : "file"}
            />
          </div>
        </div>
      ) : (
        <ChatInterface
          sessionId={sessionId}
          messages={messages}
          onNewMessage={handleNewMessage}
          onGenerateReport={() => {}}
          isThinking={false}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          currentFile={currentFile}
          isUploading={isUploading}
        />
      )}
    </div>
  );
}
