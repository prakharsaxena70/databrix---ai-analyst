"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileSpreadsheet,
  Database,
  Wrench,
  MessageCircle,
  Image as ImageIcon,
  FileText,
  Table2,
  ArrowRight,
  Command,
  Sparkles,
  BrainCircuit,
  Trash2,
  Merge,
  Code2,
  X,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "navigation" | "tools" | "ai" | "data";
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "Go to main dashboard",
      icon: <MessageCircle className="w-4 h-4" />,
      category: "navigation",
      action: () => { router.push("/app"); onClose(); },
      keywords: ["home", "main", "chat"],
    },
    {
      id: "nav-data-sources",
      label: "Data Sources",
      description: "Manage uploaded datasets",
      icon: <Database className="w-4 h-4" />,
      category: "navigation",
      action: () => { router.push("/app/data-sources"); onClose(); },
      keywords: ["files", "uploads", "datasets"],
    },
    {
      id: "nav-tools",
      label: "Tools",
      description: "Data conversion and utility tools",
      icon: <Wrench className="w-4 h-4" />,
      category: "navigation",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["convert", "transform", "utilities"],
    },
    // AI Features
    {
      id: "ai-explain",
      label: "Explain My Data",
      description: "Get an AI-powered executive summary of your data",
      icon: <BrainCircuit className="w-4 h-4" />,
      category: "ai",
      action: () => { router.push("/app"); onClose(); },
      keywords: ["summary", "insights", "analysis", "understand"],
    },
    // Tools - Conversion
    {
      id: "tool-excel-to-csv",
      label: "Excel → CSV",
      description: "Convert Excel spreadsheets to CSV format",
      icon: <FileSpreadsheet className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["xlsx", "convert", "spreadsheet"],
    },
    {
      id: "tool-pdf-to-excel",
      label: "PDF → Excel",
      description: "Extract tables from PDF to Excel",
      icon: <FileText className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["pdf", "extract", "table"],
    },
    {
      id: "tool-pdf-to-csv",
      label: "PDF → CSV",
      description: "Extract tables from PDF to CSV",
      icon: <FileText className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["pdf", "csv"],
    },
    {
      id: "tool-image-to-excel",
      label: "Image → Excel",
      description: "OCR extract tables from images to Excel",
      icon: <ImageIcon className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["ocr", "photo", "scan"],
    },
    {
      id: "tool-image-to-csv",
      label: "Image → CSV",
      description: "OCR extract tables from images to CSV",
      icon: <ImageIcon className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["ocr", "photo", "scan", "csv"],
    },
    {
      id: "tool-json-to-excel",
      label: "JSON → Excel",
      description: "Convert JSON data to Excel spreadsheet",
      icon: <Code2 className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["json", "api", "data"],
    },
    {
      id: "tool-merge-excel",
      label: "Merge Excel Files",
      description: "Combine multiple Excel files into one",
      icon: <Merge className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["combine", "join", "concat"],
    },
    {
      id: "tool-merge-csv",
      label: "Merge CSV Files",
      description: "Combine multiple CSV files into one",
      icon: <Merge className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["combine", "join", "concat", "csv"],
    },
    {
      id: "tool-generate-sql",
      label: "Generate SQL",
      description: "Create SQL statements from your data",
      icon: <Table2 className="w-4 h-4" />,
      category: "tools",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["database", "query", "insert"],
    },
    // Data Processing
    {
      id: "tool-remove-duplicates",
      label: "Remove Duplicates",
      description: "Detect and remove duplicate rows from data",
      icon: <Trash2 className="w-4 h-4" />,
      category: "data",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["dedup", "clean", "unique"],
    },
    {
      id: "tool-smart-clean",
      label: "Smart Data Cleaning",
      description: "AI-powered data cleaning and standardization",
      icon: <Sparkles className="w-4 h-4" />,
      category: "data",
      action: () => { router.push("/app/tools"); onClose(); },
      keywords: ["fix", "format", "standardize", "missing"],
    },
  ];

  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  const groupedCommands = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    navigation: "Navigate",
    ai: "AI Features",
    tools: "Conversion Tools",
    data: "Data Processing",
  };

  const flatFiltered = filteredCommands;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) {
          flatFiltered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, flatFiltered, selectedIndex, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]">
        <div className="w-full max-w-xl bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, tools, navigation..."
              className="flex-1 bg-transparent text-white text-base placeholder:text-slate-500 outline-none"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {flatFiltered.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No results for &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category}>
                  <div className="px-5 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {categoryLabels[category] || category}
                    </span>
                  </div>
                  {items.map((cmd) => {
                    itemIndex++;
                    const thisIndex = itemIndex;
                    return (
                      <button
                        key={cmd.id}
                        data-index={thisIndex}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(thisIndex)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                          selectedIndex === thisIndex
                            ? "bg-indigo-500/15 text-white"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedIndex === thisIndex
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-white/5 text-slate-400"
                          }`}
                        >
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.label}</div>
                          <div className="text-xs text-slate-500 truncate">{cmd.description}</div>
                        </div>
                        {selectedIndex === thisIndex && (
                          <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↵</kbd>
                select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>+</span>
              <span>K</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
