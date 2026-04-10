"use client";

import { Upload, Download, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onUploadClick: () => void;
  onExport: () => void;
  hasSession: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function TopBar({
  onUploadClick,
  onExport,
  hasSession,
  onToggleSidebar,
  sidebarOpen,
}: TopBarProps) {
  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border/40 bg-white/60 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          AI-Powered Data Analysis
        </span>
      </div>

      <div className="flex items-center gap-2">
        {hasSession && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
        <Button
          onClick={onUploadClick}
          size="sm"
          className="gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-200/40 text-sm font-medium transition-all duration-200"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>
    </div>
  );
}
